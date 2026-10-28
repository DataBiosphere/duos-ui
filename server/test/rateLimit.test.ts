import { describe, it, expect, afterEach, vi } from 'vitest'
import type { FastifyRequest } from 'fastify'
import {
  CALLBACK_MAX_ENV_VAR,
  LOGIN_MAX_ENV_VAR,
  callbackRateLimit,
  isRateLimitError,
  loginRateLimit,
  rateLimitKey,
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

describe('rateLimitKey', () => {
  // The fields that rateLimitKey reads. In k8s the socket peer is the Apache
  // sidecar on loopback, and request.ip is a Google front-end address.
  const request = (peer: string | undefined, headers: Record<string, string> = {}, ip = '35.191.75.100') =>
    ({ socket: { remoteAddress: peer }, headers, ip }) as unknown as FastifyRequest

  it('keys on X-Real-IP when the sidecar on loopback forwards it', () => {
    expect(rateLimitKey(request('127.0.0.1', { 'x-real-ip': '75.67.160.98' }))).toBe('75.67.160.98')
  })

  it.each(['::1', '::ffff:127.0.0.1', '127.0.0.2'])('trusts the loopback peer %s', (peer) => {
    expect(rateLimitKey(request(peer, { 'x-real-ip': '75.67.160.98' }))).toBe('75.67.160.98')
  })

  it('trims whitespace around the header value', () => {
    expect(rateLimitKey(request('127.0.0.1', { 'x-real-ip': ' 75.67.160.98 ' }))).toBe('75.67.160.98')
  })

  // A pod can reach the app port directly. Its X-Real-IP did not come from
  // the load balancer, so it must not choose the bucket.
  it.each(['10.64.4.18', '203.0.113.7', undefined])('ignores X-Real-IP from the peer %s', (peer) => {
    expect(rateLimitKey(request(peer, { 'x-real-ip': '198.51.100.9' }, '10.64.4.18'))).toBe('10.64.4.18')
  })

  // Node joins a repeated header with ", ". The load balancer writes exactly
  // one value, so anything else did not come from it.
  it.each([
    ['missing', {}],
    ['repeated', { 'x-real-ip': '198.51.100.9, 75.67.160.98' }],
    ['not an IP', { 'x-real-ip': 'example.com' }],
    ['blank', { 'x-real-ip': '  ' }],
    ['a scoped IPv6 address', { 'x-real-ip': 'fe80::1%eth0' }],
  ])('falls back to request.ip when the header is %s', (_label, headers) => {
    expect(rateLimitKey(request('127.0.0.1', headers))).toBe('35.191.75.100')
  })

  it('groups an IPv6 client to its /64, so one client cannot rotate through addresses', () => {
    const first = rateLimitKey(request('127.0.0.1', { 'x-real-ip': '2001:db8:1:2:aaaa::1' }))
    const second = rateLimitKey(request('127.0.0.1', { 'x-real-ip': '2001:db8:1:2:bbbb::2' }))

    expect(first).toBe('2001:db8:1:2::')
    expect(second).toBe(first)
  })

  it('groups an IPv6 fallback address to its /64 too', () => {
    expect(rateLimitKey(request('10.64.4.18', {}, '2001:db8:1:2:aaaa::1'))).toBe('2001:db8:1:2::')
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

describe('callbackRateLimit', () => {
  // Deliberately more generous than login: guessing is already constrained by
  // the signed session state and PKCE, so a tight limit here would only break
  // legitimate multi-tab sign-ins.
  it('defaults to 60 requests a minute', () => {
    expect(callbackRateLimit()).toEqual({ max: 60, timeWindow: '1 minute' })
  })

  it('honors the environment override', () => {
    vi.stubEnv(CALLBACK_MAX_ENV_VAR, '200')

    expect(callbackRateLimit().max).toBe(200)
  })

  it('throws when the override is not a positive integer', () => {
    vi.stubEnv(CALLBACK_MAX_ENV_VAR, '0')

    expect(() => callbackRateLimit()).toThrow(CALLBACK_MAX_ENV_VAR)
  })
})
