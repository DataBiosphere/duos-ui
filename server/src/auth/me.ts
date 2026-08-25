import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireEnv } from './oidcClient.js'
import { REFRESH_WINDOW_SECONDS, RefreshFailedError, refreshAccessToken } from './refresh.js'

const UPSTREAM_TIMEOUT_MS = 5000

/**
 * Answers an upstream 401/404. The DUOS API conflates "bad token" with "no
 * DUOS profile for this email" (both 401 — DuosUserAuthenticator turns the
 * lookup's NotFoundException into an empty principal), so the session's
 * `profileSeen` flag is the disambiguator this endpoint controls.
 */
async function answerNoProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.session.profileSeen) {
    // This session has served a profile before, so "no profile" cannot be
    // the explanation. The upstream is rejecting the token itself — revoked
    // mid-lifetime (before refresh-before-forward would touch it) or the
    // account was disabled. The terminal 401 is the honest answer; leaving
    // the session alive would send the client into re-registering an
    // existing user.
    try {
      await request.session.destroy()
    }
    catch (err: unknown) {
      request.log.error({ err }, '[auth] upstream rejected a profile-seen session but it could not be destroyed — returning 401 anyway')
    }
    reply.clearCookie('sessionId').status(401).send({ authenticated: false })
    return
  }
  // Never seen a profile: authenticated but not yet registered. Treating
  // this 401 as a dead session destroyed every brand-new user's session on
  // their first probe and made registration unreachable. In the rare case
  // of a token revoked before first contact, the client's registration
  // attempt fails too, which signs the session out. (404 kept deliberately:
  // DT-3997 restores the upstream's 404 for unregistered users.)
  reply.send({ authenticated: true, idp: request.session.idp })
}

/**
 * Confirms the user is authenticated against the upstream Consent API.
 * Forwards the upstream user profile and the active sub-provider — never the
 * tokens themselves, which stay server-side in the session.
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

  if (res.status === 401 || res.status === 404) {
    await answerNoProfile(request, reply)
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

  if (!request.session.profileSeen) {
    request.session.profileSeen = true
    // Saved explicitly before the reply, once per session (the flag never
    // flips back): with rolling off, the onSend hook only skips its async
    // save when the session is unmodified — see index.ts on the
    // ERR_HTTP_HEADERS_SENT hazard a post-reply async save creates.
    await request.session.save()
  }

  reply.send({
    authenticated: true,
    user,
    idp: request.session.idp, // 'google' | 'microsoft'
  })
}
