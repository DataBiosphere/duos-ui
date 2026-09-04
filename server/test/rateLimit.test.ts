import { describe, it, expect, afterEach, vi } from 'vitest'
import type { FastifyRequest } from 'fastify'
import {
  LOGIN_MAX_ENV_VAR,
  isRateLimitError,
  loginRateLimit,
  rateLimitPluginOptions,
} from '../src/security/rateLimit.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('rateLimitPluginOptions', () => {
  // The regression this guards: the same Fastify instance serves every SPA
  // asset through @fastify/vite, so a global cap would 429 a page load.
  it('registers with global: false so only the routes that opt in are limited', () => {
    expect(rateLimitPluginOptions.global).toBe(false)
  })

  it('builds a 429 error carrying the context status code and the shared code', () => {
    const err = rateLimitPluginOptions.errorResponseBuilder(
      {} as FastifyRequest,
      { statusCode: 429, ban: false, after: '1 minute', max: 30, ttl: 60_000 },
    )

    expect(isRateLimitError(err)).toBe(true)
    expect((err as { statusCode: number }).statusCode).toBe(429)
  })
})

describe('isRateLimitError', () => {
  it('rejects an unrelated error that merely carries a 429 status code', () => {
    const err = Object.assign(new Error('upstream said no'), { statusCode: 429 })

    expect(isRateLimitError(err)).toBe(false)
  })

  // The marker alone is not enough: the app's error handler receives whatever
  // was thrown, and a plain object could carry any property.
  it('rejects a non-Error value even when it carries the marker', () => {
    expect(isRateLimitError({ code: 'DUOS_RATE_LIMITED', statusCode: 429 })).toBe(false)
    expect(isRateLimitError(undefined)).toBe(false)
  })
})

describe('loginRateLimit', () => {
  it('defaults to 30 requests a minute', () => {
    expect(loginRateLimit()).toEqual({ max: 30, timeWindow: '1 minute' })
  })

  it('honors the environment override', () => {
    vi.stubEnv(LOGIN_MAX_ENV_VAR, '120')

    expect(loginRateLimit().max).toBe(120)
  })

  it('treats a blank override as unset', () => {
    vi.stubEnv(LOGIN_MAX_ENV_VAR, '   ')

    expect(loginRateLimit().max).toBe(30)
  })

  // A silent fallback would hide the typo; `max: 0` would block every
  // sign-in. Same posture as DUOS_DB_PORT in index.ts: fail at startup with
  // an error naming the variable. The last four are the values `Number()`
  // alone would have accepted.
  it.each(['0', '-5', 'ten', '10.5', '1e3', '0x1e', '30.0', '+30'])('throws when the override is %s', (value) => {
    vi.stubEnv(LOGIN_MAX_ENV_VAR, value)

    expect(() => loginRateLimit()).toThrow(LOGIN_MAX_ENV_VAR)
  })
})
