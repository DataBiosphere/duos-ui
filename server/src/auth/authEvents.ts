import type { FastifyRequest } from 'fastify'

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
 * Destroys the session and records why. The event is logged only after the
 * destroy succeeds, so a failed destroy is not counted as an ended session.
 */
export async function endSession(request: EventRequest, reason: SessionDestroyReason): Promise<void> {
  const idp = sessionIdp(request)
  await request.session.destroy()
  logAuthEvent(request, 'auth.session.destroyed', { reason, idp })
}
