import type { FastifyRequest, Session } from 'fastify'

/**
 * What a `save()` that failed with ENOENT means: the session's row is gone
 * (`ended`), or a later sign-in on the same row holds it (`superseded`).
 * Since @fastify/session 11.1.6, `save()` on an existing session goes through
 * the store's `compareAndSet`, which reports both as ENOENT (pgStore.ts).
 */
export type FailedSaveOutcome = 'ended' | 'superseded'

/**
 * Classifies a failed `save()`, or returns undefined for any error other than
 * ENOENT. For ENOENT it also drops this request's session, so
 * @fastify/session's onSend doesn't try the same save again (and answer a
 * second time). An unreadable store reads as `superseded`: the caller then
 * answers as transient and leaves the cookie alone.
 */
export async function failedSaveOutcome(request: FastifyRequest, err: unknown): Promise<FailedSaveOutcome | undefined> {
  if (typeof err !== 'object' || err === null || (err as { code?: unknown }).code !== 'ENOENT') return undefined
  const sid = request.session.sessionStoreId
  ;(request as { session: unknown }).session = null
  const stored = await new Promise<Session | null | undefined>((resolve) => {
    request.sessionStore.get(sid, (getErr: unknown, session?: Session | null) => resolve(getErr ? undefined : session ?? null))
  })
  return stored === null ? 'ended' : 'superseded'
}
