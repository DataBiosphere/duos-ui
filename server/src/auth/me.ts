import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireEnv } from './oidcClient.js'
import { RefreshFailedError, refreshAccessToken } from './refresh.js'
import { REFRESH_WINDOW_SECONDS } from '../proxy/upstreamProxy.js'

const UPSTREAM_TIMEOUT_MS = 5000

/**
 * Confirms the user is authenticated against the upstream Consent API.
 * Forwards the upstream user profile and the active sub-provider — never the
 * tokens themselves, which stay server-side in the session.
 */
export async function getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.session.accessToken) {
    reply.status(401).send({ authenticated: false })
    return
  }

  // Refresh-before-forward, mirroring the API proxy: an idle tab can outlive
  // the access token while the refresh token and session are still perfectly
  // valid. Forwarding the expired token would 401 upstream and destroy a
  // session that only needed a refresh — and the client's focus revalidation
  // makes this exact path hot.
  const secondsRemaining = (request.session.tokenExpiry ?? 0) - Math.floor(Date.now() / 1000)
  if (secondsRemaining < REFRESH_WINDOW_SECONDS) {
    try {
      await refreshAccessToken(request)
    }
    catch (err: unknown) {
      if (err instanceof RefreshFailedError) {
        // Terminal: B2C rejected the refresh token and refreshAccessToken has
        // already destroyed the session — clear the dead cookie.
        reply.clearCookie('sessionId').status(401).send({ authenticated: false })
        return
      }
      // Transient (network blip, B2C 5xx, store error) — the session is
      // intact, so this must not read as signed out permanently: 502 tells
      // the client probe to retry on the next ask.
      reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
      return
    }
  }

  const url = `${requireEnv('DUOS_API_URL')}/api/user/me`

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${request.session.accessToken}`,
        'Accept': 'application/json',
        'X-App-ID': 'DUOS',
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  }
  catch {
    // Network failure or timeout — same as any other upstream outage below:
    // says nothing about the token's validity, so don't destroy the session.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  if (res.status === 401) {
    // The upstream API is the source of truth for token validity — a session
    // whose access token it now rejects (expired, revoked) is dead weight.
    await request.session.destroy()
    reply.clearCookie('sessionId').status(401).send({ authenticated: false })
    return
  }

  if (res.status === 404) {
    // Authenticated but not yet registered: the session is valid, the DUOS
    // profile just doesn't exist yet. Report authenticated with no user so
    // the client can run its post-sign-in registration bootstrap — collapsing
    // this into a failure would make every new user look signed out and leave
    // registration unreachable.
    reply.send({ authenticated: true, idp: request.session.idp })
    return
  }

  if (!res.ok) {
    // A non-401 failure (5xx, upstream outage) says nothing about whether the
    // token itself is still valid — don't destroy the session or parse an
    // error body as if it were a user profile.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  let user: unknown
  try {
    user = await res.json()
  }
  catch {
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  reply.send({
    authenticated: true,
    user,
    idp: request.session.idp, // 'google' | 'microsoft'
  })
}
