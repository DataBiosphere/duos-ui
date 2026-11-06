import type { FastifyRequest } from 'fastify'
import type { DestroyGeneration, DestroyOutcome } from '../session/pgStore.js'

/**
 * Structured auth events for Cloud Logging (BFF Epic 6, story 6-F).
 *
 * Each event name is stable and the labels are an allowlist: callers name the
 * fields to log and never pass a session, tokens or claims. `idp` is always
 * present, as `unknown` when the sub-provider is not yet known, so no event
 * drops out of a provider-split view.
 */

type EventRequest = Pick<FastifyRequest, 'log' | 'session'>
export type Idp = 'google' | 'microsoft' | 'unknown'

// `idp` is required, so each caller decides where it comes from. There is no
// fallback to the request's session: a signed-in user who starts a new login
// keeps their old session until the callback replaces it, so a fallback would
// label a pre-auth event with the PREVIOUS provider.
type EventFields = Record<string, unknown> & { idp: Idp }

/** The provider of the session this request already holds, for events about that session. */
export function sessionIdp(request: EventRequest): Idp {
  return request.session?.idp ?? 'unknown'
}

export type SessionDestroyReason = 'logout' | 'upstream_401' | 'refresh_terminal' | 'expired' | 'provider_conflict'

export function logAuthEvent(
  request: EventRequest,
  event: string,
  fields: EventFields,
  level: 'info' | 'warn' = 'info',
): void {
  request.log[level]({ ...fields, event }, event)
}

/**
 * Whether `endSession` ended this request's session, or found that a later
 * sign-in now holds its row. A caller that gets `superseded` must leave the
 * cookie alone: the browser now carries the later sign-in's cookie.
 */
export type EndSessionOutcome = 'ended' | 'superseded'

/**
 * Destroys the session and records why. The event is logged only after the
 * destroy succeeds, so a failed destroy is not counted as an ended session.
 *
 * Since @fastify/session 11.1.6 a sign-in keeps the store row and starts a new
 * generation, so a request that loaded an earlier generation could otherwise
 * delete the later sign-in (an upstream 401 on a request still in flight).
 * The destroy therefore checks the generation (pgStore's destroyGeneration).
 * Logout doesn't: it is the user signing this browser out.
 */
export async function endSession(request: EventRequest, reason: SessionDestroyReason): Promise<EndSessionOutcome> {
  const idp = sessionIdp(request)
  const destroyGeneration = (request as { sessionStore?: { destroyGeneration?: DestroyGeneration } }).sessionStore?.destroyGeneration
  if (reason !== 'logout' && destroyGeneration) {
    const { sessionStoreId, sessionId } = request.session
    let outcome: DestroyOutcome | undefined
    try {
      outcome = await new Promise<DestroyOutcome | undefined>((resolve, reject) => {
        destroyGeneration(sessionStoreId, sessionId, (err, result) => {
          if (!err) resolve(result)
          // Store callbacks can hand back plain objects; keep those as the cause.
          else reject(err instanceof Error ? err : new Error('session store destroy failed', { cause: err }))
        })
      })
    }
    finally {
      // Drop the session as the plugin's destroy() would, even when the delete
      // fails: left attached, a session saved earlier in this request would
      // have its cookie re-sent over the caller's clearCookie. No second,
      // unconditional DELETE either.
      ;(request as { session: unknown }).session = null
    }
    if (outcome === 'superseded') {
      logAuthEvent(request, 'auth.session.superseded', { reason, idp })
      return 'superseded'
    }
    logAuthEvent(request, 'auth.session.destroyed', { reason, idp })
    return 'ended'
  }
  await request.session.destroy()
  logAuthEvent(request, 'auth.session.destroyed', { reason, idp })
  return 'ended'
}
