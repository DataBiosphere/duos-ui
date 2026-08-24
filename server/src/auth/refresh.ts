import * as oidc from 'openid-client'
import type { FastifyRequest, Session } from 'fastify'
import { getOidcConfig } from './oidcClient.js'

/**
 * Proactive B2C access-token refresh for the API proxy (Phase 3, story 3-B).
 *
 * The proxy calls this when the session's access token expires within 60
 * seconds, so a browser never sees a 401 caused by ordinary token expiry. The
 * refresh token never leaves the server.
 *
 * Two failure modes are deliberately distinguished, because conflating them
 * signs users out of healthy sessions:
 *
 *   - `RefreshFailedError` — B2C rejected this refresh token (`invalid_grant`).
 *     The session is destroyed and cannot recover; the proxy returns 401 and the
 *     client redirects to sign-in.
 *   - anything else — transient (network blip, B2C 5xx, `invalid_client` from a
 *     misconfigured secret, a DB error while saving). The session survives and
 *     the proxy should return 502. Treating these as 401 would mass-log-out
 *     every user the moment B2C hiccuped or a client secret was rotated wrong.
 */

/** Fatal: the refresh token is dead and the session has been destroyed. */
export class RefreshFailedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RefreshFailedError'
  }
}

interface RefreshedTokens {
  accessToken: string
  refreshToken: string
  idToken: string | undefined
  tokenExpiry: number
}

/**
 * Single-flight per session. A SPA fires many API calls at once; inside the
 * 60-second window every one of them would otherwise redeem the same refresh
 * token. B2C policies may rotate refresh tokens, and a rotated-then-reused
 * token comes back `invalid_grant` — so without this, the losing requests would
 * destroy a session that the winning request had just successfully refreshed.
 *
 * Keyed by `sessionId`. The entry spans the token exchange AND the leader's
 * store write, so it is not removed until the rotated token is persisted — see
 * `refreshAccessToken`.
 */
/**
 * How early to renew the access token. Wide enough that a request which passes
 * this check still has a usable token by the time it reaches the upstream, so
 * ordinary expiry never reaches the browser as a 401. Refresh policy, so it
 * lives here; the proxy layer re-exports it for its existing consumers.
 */
export const REFRESH_WINDOW_SECONDS = 60

const inFlight = new Map<string, Promise<RefreshedTokens>>()

/**
 * Refreshes the session's access token, applying the result to
 * `request.session` and persisting it. Concurrent calls for the same session
 * share one token-endpoint round-trip.
 *
 * Precondition: `request.session` exists and carries a refresh token — the
 * caller (`apiProxy`) has already established that there is a session.
 */
export async function refreshAccessToken(request: FastifyRequest): Promise<void> {
  const sid = request.session.sessionId
  const usedRefreshToken = request.session.refreshToken

  if (!usedRefreshToken) {
    // Terminal, not transient: a session with no refresh token can never renew
    // its access token (B2C omits one when `offline_access` was not granted), so
    // it is only ever seconds away from being useless. Destroy it now and make
    // the user re-authenticate rather than serve 401s until the token expires.
    await request.session.destroy()
    throw new RefreshFailedError('no_refresh_token')
  }

  // Each caller applies the shared result to its own session: every concurrent
  // request has its OWN `Session` instance (each is hydrated from the store at
  // the start of its own request), so a mutation made once inside the flight
  // would be invisible to every request but the one that started it.
  //
  // Followers must adopt rather than proceed on their stale token. Refresh
  // normally fires 60 s early, but a pod idle past expiry can see a burst of
  // requests holding an already-expired token, and forwarding that upstream
  // would earn a 401 — which story 3-E turns into a session destroy, logging the
  // user out despite a successful refresh.
  // Compared against undefined rather than tested for truthiness: the value is a
  // Promise, and a promise in a boolean position is the shape of the classic
  // forgotten-await bug, so static analysis flags it even when — as here — the
  // check is really "is there an entry in the map".
  const joined = inFlight.get(sid)
  if (joined !== undefined) {
    const tokens = await joined
    await applyTokens(request, tokens)
    return
  }

  // The flight deliberately spans the token exchange AND this request's store
  // write, and is only released once both are done. Releasing it at the end of
  // the exchange instead would leave a window in which the rotated token exists
  // at B2C but not yet in the store: a request arriving there starts a second
  // flight with the token it loaded moments ago, gets `invalid_grant` (B2C has
  // already rotated it), re-reads the store to check for a cross-pod winner,
  // and can still see the pre-rotation token — destroying a healthy session.
  // Holding the flight through persistence keeps the store strictly ahead of
  // the map, so that re-read always finds the winner's tokens.
  const flight = (async (): Promise<RefreshedTokens> => {
    const tokens = await doRefresh(request, sid, usedRefreshToken)
    await applyTokens(request, tokens)
    return tokens
  })()
  inFlight.set(sid, flight)
  try {
    await flight
  }
  finally {
    inFlight.delete(sid)
  }
}

/**
 * The shared body of a refresh: one token-endpoint round-trip, resolving with
 * the tokens for every caller to apply to its own session.
 *
 * Deliberately free of session mutation apart from the destroy path, so the
 * leader and its followers go through exactly one `applyTokens` each. Ordering
 * against the store write is `refreshAccessToken`'s job: it holds the flight
 * open until the leader has persisted, so nothing observes a rotated-at-B2C but
 * unpersisted token.
 */
async function doRefresh(
  request: FastifyRequest,
  sid: string,
  usedRefreshToken: string,
): Promise<RefreshedTokens> {
  const config = await getOidcConfig()

  let refreshed: Awaited<ReturnType<typeof oidc.refreshTokenGrant>>
  try {
    refreshed = await oidc.refreshTokenGrant(config, usedRefreshToken)
  }
  catch (err: unknown) {
    // openid-client v6 throws a typed ResponseBodyError when the token endpoint
    // returns an OAuth error object — unlike a raw fetch, which would hand back
    // a non-2xx body with no indication anything was wrong.
    //
    // Only `invalid_grant` is fatal ("this refresh token is dead" — including
    // B2C's expired/revoked-token cases). Every other OAuth error is a property
    // of the deployment rather than of this session: `invalid_client` means the
    // client secret is wrong, `server_error`/`temporarily_unavailable` mean B2C
    // is unwell. Destroying sessions on those would turn one misconfiguration
    // into a fleet-wide logout, so they propagate as transient.
    if (err instanceof oidc.ResponseBodyError && err.error === 'invalid_grant') {
      // Before destroying, re-read the session from the store: a refresher on
      // another pod may already have rotated the token, in which case
      // `invalid_grant` means "you lost the race", not "the session is dead".
      // Adopt the winner's tokens instead of destroying a healthy session.
      const stored = await readStoredSession(request, sid).catch((err: unknown) => {
        // Swallowed on purpose — an unreadable store cannot distinguish a
        // cross-pod winner from a genuinely dead session, and destroying is the
        // conservative answer either way. Logged because it is otherwise
        // indistinguishable from a store that confirmed this token is current,
        // and it is the difference between "the user's session ended" and "the
        // database was unreachable".
        request.log.warn({ sid, err }, '[auth] session store unreadable while checking for a cross-pod refresh winner')
        return null
      })
      if (stored?.refreshToken && stored.refreshToken !== usedRefreshToken && stored.accessToken) {
        request.log.info({ sid }, '[auth] refresh lost a cross-pod race — adopting the stored tokens')
        return {
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          idToken: stored.idToken,
          tokenExpiry: stored.tokenExpiry ?? 0,
        }
      }

      // Unreadable store falls through to here as well: B2C has told us the
      // token we hold is dead, and without a store read there is nothing to
      // adopt, so destroying is the only outcome that converges.
      //
      // This destroys through whichever request started the flight, which is
      // enough for the followers too: the store row is keyed by sid, so one
      // DELETE ends the session for all of them, and they each see this
      // rejection and return 401. Their own session objects stay in memory but
      // unmodified, so nothing writes the row back.
      request.log.warn({ sid }, '[auth] B2C rejected the refresh token — destroying the session')
      await request.session.destroy()
      throw new RefreshFailedError('refresh_failed')
    }
    throw err
  }

  return {
    accessToken: refreshed.access_token,
    // Rotation is optional per B2C policy: keep the existing token when the
    // response omits one, or it would be dropped and the session left unable
    // to refresh again.
    refreshToken: refreshed.refresh_token ?? usedRefreshToken,
    idToken: refreshed.id_token ?? request.session.idToken,
    // v6 exposes expires_in (seconds from now) via the expiresIn() helper —
    // there is no expires_at on the token response.
    tokenExpiry: Math.floor(Date.now() / 1000) + (refreshed.expiresIn() ?? 0),
  }
}

/**
 * Writes the tokens onto this request's session and persists it.
 *
 * The save is explicit rather than left to `@fastify/session`'s `onSend` hook.
 * That hook writes asynchronously while the route handler's promise is already
 * resolving, which leaves `reply.sent` false, makes Fastify fire a second
 * `reply.send()`, and crashes the process with ERR_HTTP_HEADERS_SENT — the
 * Phase 2 bug fixed in 25a71a81. Saving here resets the session's
 * modified-hash, so `onSend` finds nothing to do and completes synchronously.
 *
 * Note the whole session blob is rewritten, so a concurrent write to an
 * unrelated field can be clobbered. That is inherent to JSON-blob session
 * storage and already true of every other `save()` in the BFF, not something
 * refresh introduces.
 */
async function applyTokens(request: FastifyRequest, tokens: RefreshedTokens): Promise<void> {
  request.session.accessToken = tokens.accessToken
  request.session.refreshToken = tokens.refreshToken
  request.session.idToken = tokens.idToken
  request.session.tokenExpiry = tokens.tokenExpiry
  await request.session.save()
}

/**
 * `sessionStore.get` promisified. The store is callback-based
 * (`@fastify/session`'s `SessionStore` contract) and returns the raw `sess`
 * JSON, or null when the row is gone or expired.
 */
function readStoredSession(request: FastifyRequest, sid: string): Promise<Session | null> {
  return new Promise((resolve, reject) => {
    request.sessionStore.get(sid, (err: unknown, stored?: Session | null) => {
      if (err) {
        // A non-Error rejection value is attached as `cause` rather than
        // stringified into the message: store callbacks hand back plain objects,
        // and String() would flatten those to '[object Object]'.
        reject(err instanceof Error ? err : new Error('session store read failed', { cause: err }))
        return
      }
      resolve(stored ?? null)
    })
  })
}

// Test-only: clear in-flight refreshes between cases so one test's pending
// promise cannot be adopted by the next.
export const resetInFlightRefreshes = (): void => {
  inFlight.clear()
}
