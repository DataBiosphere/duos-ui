import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireEnv } from './oidcClient.js'
import { REFRESH_WINDOW_SECONDS, RefreshFailedError, refreshAccessToken } from './refresh.js'

const UPSTREAM_TIMEOUT_MS = 5000

/**
 * Shown when the upstream 409 arrives without a usable message — the client
 * needs something actionable even if the body was empty or malformed.
 */
const PROVIDER_CONFLICT_FALLBACK_MESSAGE
  = 'You may have previously signed in with a different authentication provider (Google or Microsoft). Please sign in with that provider.'

/**
 * Ends a session the upstream has authoritatively rejected.
 */
async function destroySession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.session.destroy()
  }
  catch (err: unknown) {
    request.log.error({ err }, '[auth] upstream rejected the session but it could not be destroyed — answering as signed out anyway')
  }
  reply.clearCookie('sessionId')
}

/**
 * Confirms the user is authenticated against the upstream Consent API.
 * Forwards the upstream user profile and the active sub-provider — never the
 * tokens themselves, which stay server-side in the session.
 *
 * The upstream /api/user/me contract:
 * - 200 registered profile
 * - 401 rejected token
 * - 404 authenticated but unregistered
 * - 409 Sam sub-provider conflict
 */
export async function getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // The answer is per-session and now gates the whole SPA: no intermediary
  // (or the browser's heuristic cache) may replay one user's profile to
  // another, or a stale answer to the same user.
  reply.header('cache-control', 'no-store')
  reply.header('vary', 'Cookie')

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
    // The upstream rejected the token itself — revoked mid-lifetime (before refresh-before-forward would
    // touch it) or the account was disabled. The terminal 401 is final so the session must be destroyed.
    // The client still needs to know it is signed out, so the reply goes out after the session is destroyed.
    await destroySession(request, reply)
    reply.status(401).send({ authenticated: false })
    return
  }

  if (res.status === 404) {
    // Authenticated but not yet registered — the session is valid, and the
    // client's post-sign-in bootstrap needs authenticated:true (with user
    // absent) to reach its registration flow.
    reply.send({ authenticated: true, idp: request.session.idp })
    return
  }

  if (res.status === 409) {
    // Sam sub-provider conflict: the account exists under the other B2C sub-provider and Sam rejects it.
    // Registration cannot succeed and the session cannot become usable, so end it — but forward the
    // upstream's actionable message (sign in with the other provider, plus the support link) instead
    // of a generic failure.
    let message = PROVIDER_CONFLICT_FALLBACK_MESSAGE
    try {
      const body: unknown = await res.json()
      const upstreamMessage = (body as { message?: unknown } | null)?.message
      if (typeof upstreamMessage === 'string' && upstreamMessage.length > 0) {
        message = upstreamMessage
      }
    }
    catch {
      // Unparseable body — the fallback message stands.
    }
    await destroySession(request, reply)
    reply.status(409).send({ authenticated: false, error: 'provider_conflict', message })
    return
  }

  if (!res.ok) {
    // A non-4xx failure (5xx, upstream outage) says nothing about whether the
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
