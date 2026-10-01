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
type Idp = 'google' | 'microsoft' | 'unknown'
type EventFields = Record<string, unknown> & { idp?: Idp }

export type SessionDestroyReason = 'logout' | 'upstream_401' | 'refresh_terminal' | 'expired'

export function logAuthEvent(
  request: EventRequest,
  event: string,
  fields: EventFields = {},
  level: 'info' | 'warn' = 'info',
): void {
  const idp = fields.idp ?? request.session?.idp ?? 'unknown'
  request.log[level]({ ...fields, event, idp }, event)
}

/**
 * Destroys the session and records why. The event is logged only after the
 * destroy succeeds, so a failed destroy is not counted as an ended session.
 */
export async function endSession(request: EventRequest, reason: SessionDestroyReason): Promise<void> {
  const idp = request.session.idp ?? 'unknown'
  await request.session.destroy()
  logAuthEvent(request, 'auth.session.destroyed', { reason, idp })
}
