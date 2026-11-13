/**
 * Retries for the showcase health check (DT-4359, S4.3). A transient failure is retried with a
 * capped exponential backoff before the check reports anything, so a blip in a lookup or a link
 * does not reach the owners.
 */

/** One attempt's outcome: a final answer, or a transient failure worth another try. */
export type AttemptResult<T>
  = | { done: T }
    | { retry: string, retryAfterMs?: number }

export interface RetryOptions {
  /** Total attempts, the first included. */
  attempts: number
  /** The wait before the second attempt; it doubles for each one after. */
  baseDelayMs: number
  /** No wait is longer than this, a server's `Retry-After` included. */
  maxDelayMs: number
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>
}

export const DEFAULT_RETRY: RetryOptions = { attempts: 4, baseDelayMs: 2_000, maxDelayMs: 60_000 }

const realSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/** The last transient reason, when every attempt failed. */
export type RetryResult<T> = { ok: true, value: T } | { ok: false, reason: string, attempts: number }

/** Runs `attempt` until it is done or the attempts run out. */
export async function withRetry<T>(attempt: (attemptNumber: number) => Promise<AttemptResult<T>>, options: RetryOptions = DEFAULT_RETRY): Promise<RetryResult<T>> {
  const { attempts, baseDelayMs, maxDelayMs, sleep = realSleep } = options
  let reason = 'no attempt was made'
  for (let attemptNumber = 1; attemptNumber <= attempts; attemptNumber++) {
    const result = await attempt(attemptNumber)
    if ('done' in result) return { ok: true, value: result.done }
    reason = result.retry
    if (attemptNumber < attempts) {
      const backoff = baseDelayMs * 2 ** (attemptNumber - 1)
      await sleep(Math.min(result.retryAfterMs ?? backoff, maxDelayMs))
    }
  }
  return { ok: false, reason, attempts }
}

/** A `Retry-After` header in milliseconds, in seconds or as an HTTP date; a past date is 0. */
export const retryAfterMs = (header: string | null, now: () => number = Date.now): number | undefined => {
  const value = header?.trim()
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10) * 1000
  // Only the HTTP-date form; Date.parse would also accept a bare number such as "-3" or "1.5".
  const date = /[a-z]/i.test(value) ? Date.parse(value) : Number.NaN
  return Number.isNaN(date) ? undefined : Math.max(0, date - now())
}
