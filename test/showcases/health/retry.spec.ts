import { describe, expect, it, vi } from 'vitest'
import { type AttemptResult, retryAfterMs, withRetry } from 'src/showcases/health/retry'

const options = (sleep: (ms: number) => Promise<void>) => ({ attempts: 4, baseDelayMs: 100, maxDelayMs: 1_000, sleep })

describe('withRetry', () => {
  it('returns the first answer without waiting', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const attempt = vi.fn().mockResolvedValue({ done: 'answer' })

    expect(await withRetry(attempt, options(sleep))).toEqual({ ok: true, value: 'answer' })
    expect(attempt).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('retries a transient failure and returns the answer that follows', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const attempt = vi.fn<(n: number) => Promise<AttemptResult<string>>>()
      .mockResolvedValueOnce({ retry: 'the lookup answered 503' })
      .mockResolvedValueOnce({ retry: 'the lookup answered 502' })
      .mockResolvedValueOnce({ done: 'answer' })

    expect(await withRetry(attempt, options(sleep))).toEqual({ ok: true, value: 'answer' })
    expect(attempt.mock.calls.map(([n]) => n)).toEqual([1, 2, 3])
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200])
  })

  it('gives up after the last attempt with the last reason, without a final wait', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const attempt = vi.fn<(n: number) => Promise<AttemptResult<string>>>()
      .mockResolvedValueOnce({ retry: 'first' })
      .mockResolvedValueOnce({ retry: 'second' })
      .mockResolvedValueOnce({ retry: 'third' })
      .mockResolvedValueOnce({ retry: 'fourth' })

    expect(await withRetry(attempt, options(sleep))).toEqual({ ok: false, reason: 'fourth', attempts: 4 })
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200, 400])
  })

  it('waits as long as the server asks, up to the cap', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const attempt = vi.fn<(n: number) => Promise<AttemptResult<string>>>()
      .mockResolvedValueOnce({ retry: '429', retryAfterMs: 500 })
      .mockResolvedValueOnce({ retry: '429', retryAfterMs: 120_000 })
      .mockResolvedValueOnce({ done: 'answer' })

    await withRetry(attempt, options(sleep))

    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([500, 1_000])
  })

  it('caps the exponential backoff', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const attempt = vi.fn().mockResolvedValue({ retry: 'down' })

    await withRetry(attempt, { attempts: 6, baseDelayMs: 300, maxDelayMs: 1_000, sleep })

    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([300, 600, 1_000, 1_000, 1_000])
  })
})

describe('retryAfterMs', () => {
  it.each([
    ['7', 7_000],
    [' 0 ', 0],
    [null, undefined],
    ['', undefined],
    ['-3', undefined],
    ['1.5', undefined],
    ['soon', undefined],
    // An HTTP date is the time left until it, measured from 07:27:30; a past one is 0.
    ['Wed, 21 Oct 2026 07:28:00 GMT', 30_000],
    ['Wed, 21 Oct 2026 07:00:00 GMT', 0],
  ])('reads %j as %j', (header, expected) => {
    expect(retryAfterMs(header, () => Date.parse('2026-10-21T07:27:30Z'))).toBe(expected)
  })
})
