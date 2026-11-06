import type { FastifyReply, FastifyRequest } from 'fastify'
import { endSession } from './authEvents.js'
import type { SessionDestroyReason } from './authEvents.js'
import { requireEnv } from './oidcClient.js'
import { RefreshFailedError, refreshAccessToken, tokenDisposition } from './refresh.js'
import { SESSION_COOKIE_NAME } from '../session/sessionOptions.js'

const UPSTREAM_TIMEOUT_MS = 5000

/**
 * Shown when the upstream 409 arrives without a usable message — the client
 * needs something actionable even if the body was empty or malformed.
 */
const PROVIDER_CONFLICT_FALLBACK_MESSAGE
  = 'You may have previously signed in with a different authentication provider (Google or Microsoft). Please sign in with that provider.'

/**
 * Ends a session that can no longer be used, recording why. 'failed' means the
 * destroy threw, so it can't tell whether a later sign-in holds the row; the
 * cookie must stay, as for 'superseded', and the next request retries.
 */
async function tryEndSession(request: FastifyRequest, reason: SessionDestroyReason): Promise<'ended' | 'superseded' | 'failed'> {
  try {
    return await endSession(request, reason) === 'superseded' ? 'superseded' : 'ended'
  }
  catch (err: unknown) {
    request.log.error({ err }, '[auth] upstream rejected the session but it could not be destroyed — keeping the cookie')
    return 'failed'
  }
}

/**
 * Ends a session that can no longer be used. Returns false, and answers 502
 * itself, when a later sign-in holds the row or the destroy failed: this
 * request's sign-in is over but the browser's may not be, and a 401 would make
 * the client sign the browser out.
 */
async function destroySession(request: FastifyRequest, reply: FastifyReply, reason: SessionDestroyReason): Promise<boolean> {
  if (await tryEndSession(request, reason) !== 'ended') {
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return false
  }
  reply.clearCookie(SESSION_COOKIE_NAME)
  return true
}

/**
 * Refresh-before-forward, mirroring the API proxy: an idle tab can outlive
 * the access token while the refresh token and session are still perfectly
 * valid. Forwarding the expired token would 401 upstream and destroy a
 * session that only needed a refresh — and the client's focus revalidation
 * makes this exact path hot.
 *
 * Returns false when the refresh failed and the reply has already gone out.
 */
async function refreshedIfExpiring(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  if (tokenDisposition(request.session) !== 'refresh') return true
  try {
    await refreshAccessToken(request)
    return true
  }
  catch (err: unknown) {
    if (err instanceof RefreshFailedError) {
      // Terminal: B2C rejected the refresh token and refreshAccessToken has
      // already destroyed the session — clear the dead cookie.
      reply.clearCookie(SESSION_COOKIE_NAME).status(401).send({ authenticated: false })
      return false
    }
    // Transient (network blip, B2C 5xx, store error) — the session is
    // intact, so this must not read as signed out permanently: 502 tells
    // the client probe to retry on the next ask.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return false
  }
}

/**
 * The actionable message from the upstream 409 body ({ message, code }), or
 * the fallback when the body is empty, malformed, or not a string.
 */
async function providerConflictMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    const upstreamMessage = (body as { message?: unknown } | null)?.message
    if (typeof upstreamMessage === 'string' && upstreamMessage.length > 0) {
      return upstreamMessage
    }
  }
  catch {
    // Unparseable body — the fallback message stands.
  }
  return PROVIDER_CONFLICT_FALLBACK_MESSAGE
}

/**
 * Answers every upstream status that carries no profile: a rejected token
 * (401), an unregistered user (404), a sub-provider conflict (409), or any
 * other failure. Returns true when it has answered.
 */
async function answeredWithoutProfile(request: FastifyRequest, reply: FastifyReply, res: Response): Promise<boolean> {
  if (res.status === 401) {
    // The upstream rejected the token itself — revoked mid-lifetime (before refresh-before-forward would
    // touch it) or the account was disabled. The terminal 401 is final so the session must be destroyed.
    // The client still needs to know it is signed out, so the reply goes out after the session is destroyed.
    if (!(await destroySession(request, reply, 'upstream_401'))) return true
    reply.status(401).send({ authenticated: false })
    return true
  }

  if (res.status === 404) {
    // Authenticated but not yet registered — the session is valid, and the
    // client's post-sign-in bootstrap needs authenticated:true (with user
    // absent) to reach its registration flow.
    reply.send({ authenticated: true, idp: request.session.idp })
    return true
  }

  if (res.status === 409) {
    // Sam sub-provider conflict: the account exists under the other B2C sub-provider and Sam rejects it.
    // Registration cannot succeed and the session cannot become usable, so end it — but forward the
    // upstream's actionable message (sign in with the other provider, plus the support link) instead
    // of a generic failure.
    const message = await providerConflictMessage(res)
    const ended = await tryEndSession(request, 'provider_conflict')
    if (ended === 'superseded') {
      reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
      return true
    }
    // A failed destroy still forwards the message, since only it tells the user
    // what to do, but keeps the cookie in case a later sign-in holds the row.
    if (ended === 'ended') reply.clearCookie(SESSION_COOKIE_NAME)
    reply.status(409).send({ authenticated: false, error: 'provider_conflict', message })
    return true
  }

  if (!res.ok) {
    // An unmapped status — 5xx, an upstream outage, or a 4xx the contract
    // does not define (400/403/429) — says nothing about whether the token
    // itself is still valid: don't destroy the session or parse an error
    // body as if it were a user profile. 502 tells the probe to retry.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return true
  }

  return false
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

  if (tokenDisposition(request.session) === 'expired') {
    // A fixture token cannot renew: end the session now, exactly as an
    // upstream 401 would after the token expired in flight.
    if (!(await destroySession(request, reply, 'expired'))) return
    reply.status(401).send({ authenticated: false })
    return
  }

  if (!(await refreshedIfExpiring(request, reply))) return

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

  if (await answeredWithoutProfile(request, reply, res)) return

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
    idp: request.session.idp, // 'google' | 'microsoft' | 'unknown'
  })
}
