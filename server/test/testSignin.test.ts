import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { checkClaims, createTestSigninHandler, testSigninEmails } from '../src/auth/testSignin.js'
import { buildAppShell, nowSeconds, trackSession } from './proxyTestHarness.js'
import { fetchMetadataGuard } from '../src/security/fetchMetadata.js'
import { rateLimitPluginOptions, testSigninRateLimit } from '../src/security/rateLimit.js'
import { handleServerError } from '../src/index.js'

const emails = ['admin', 'chair', 'member', 'researcher', 'signing-official'].map(role => `${role}@automation.iam.gserviceaccount.com`)
const claims = () => ({ email: emails[0], email_verified: 'true', scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile', expires_in: '3600' })
let app: FastifyInstance
let current: FastifyRequest
let tracked: ReturnType<typeof trackSession>
const audit = vi.fn().mockResolvedValue({ rows: [] })
const response = (body: unknown = claims(), status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => response()))
  app = await buildAppShell()
  app.decorate('pg', { query: audit } as never)
  app.setErrorHandler(handleServerError)
  await app.register(rateLimit, rateLimitPluginOptions)
  tracked = trackSession(app)
  app.addHook('onRequest', async (request) => {
    current = request
  })
  app.get('/seed', async (request) => {
    request.session.accessToken = 'old-token'
    request.session.refreshToken = 'old-refresh'
    request.session.idToken = 'old-id'
    await request.session.save()
    return { sid: request.session.sessionId }
  })
  app.post('/auth/test-signin', { onRequest: fetchMetadataGuard, config: { rateLimit: { ...testSigninRateLimit(), max: 2 } } }, createTestSigninHandler(new Set(emails)))
})
afterEach(async () => {
  await app.close()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
const signIn = (payload: unknown = { accessToken: 'opaque-secret' }) => app.inject({ method: 'POST', url: '/auth/test-signin', payload: payload as never })

it('rotates and persists a real session with verified expiry and retires the old SID', async () => {
  const seed = await app.inject('/seed')
  const oldSid = seed.json().sid
  const before = nowSeconds()
  const res = await app.inject({ method: 'POST', url: '/auth/test-signin', headers: { cookie: seed.headers['set-cookie'] as string }, payload: { accessToken: 'opaque-secret' } })
  expect(res.statusCode).toBe(204)
  expect(res.payload).toBe('')
  expect(current.session.sessionId).not.toBe(oldSid)
  expect(current.session).toMatchObject({ accessToken: 'opaque-secret', userId: emails[0], testFixture: true, idp: 'google' })
  expect(current.session.tokenExpiry).toBeGreaterThanOrEqual(before + 3600)
  expect(current.session.tokenExpiry).toBeLessThanOrEqual(nowSeconds() + 3600)
  expect(current.session.refreshToken).toBeUndefined()
  expect(current.session.idToken).toBeUndefined()
  expect(audit).toHaveBeenCalledWith(expect.stringContaining('end_reason = \'rotated\''), [oldSid])
  expect(res.headers['set-cookie']).toBeDefined()
  expect(res.headers['cache-control']).toBe('no-store')
  expect(fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/tokeninfo', expect.objectContaining({ method: 'POST', redirect: 'error', signal: expect.any(AbortSignal) }))
  const body = vi.mocked(fetch).mock.calls[0][1]?.body as URLSearchParams
  expect(body.get('access_token')).toBe('opaque-secret')
  expect(await tracked.stored()).toBeNull()
  await new Promise<void>((resolve, reject) => current.sessionStore.get(current.session.sessionId, (err, value) => {
    if (err) return reject(err)
    expect(value).toMatchObject({ testFixture: true, accessToken: 'opaque-secret' })
    resolve()
  }))
})

it.each([
  { email: 'outsider@automation.iam.gserviceaccount.com' }, { email: undefined },
  { email_verified: false }, { email_verified: 'false' }, { email_verified: undefined },
  { scope: 'email' }, { scope: 'profile' }, { scope: 'openid' },
  { expires_in: '299' }, { expires_in: '-1' }, { expires_in: 'Infinity' },
  { expires_in: undefined }, { expires_in: true }, { expires_in: 301.5 },
])('rejects invalid claims %j without creating a session', async (overrides) => {
  vi.mocked(fetch).mockResolvedValue(response({ ...claims(), ...overrides }))
  const res = await signIn()
  expect(res.statusCode).toBe(401)
  expect(res.payload).toBe('')
  expect(res.headers['set-cookie']).toBeUndefined()
  expect(current.session.accessToken).toBeUndefined()
})
describe('checkClaims', () => {
  it.each([
    [undefined, 'tokeninfo_unavailable'],
    [{ ...claims(), email: 'outsider@automation.iam.gserviceaccount.com' }, 'email_not_allowlisted'],
    [{ ...claims(), email: undefined }, 'email_not_allowlisted'],
    [{ ...claims(), email_verified: 'false' }, 'email_not_verified'],
    [{ ...claims(), scope: 'profile' }, 'email_scope_missing'],
    [{ ...claims(), scope: 'email' }, 'profile_scope_missing'],
    [{ ...claims(), scope: undefined }, 'email_scope_missing'],
    [{ ...claims(), expires_in: '301.5' }, 'expires_in_invalid'],
    [{ ...claims(), expires_in: undefined }, 'expires_in_invalid'],
    [{ ...claims(), expires_in: '299' }, 'expires_in_too_short'],
  ])('names the first failing check for %j', (info, claim) => {
    expect(checkClaims(info, new Set(emails))).toEqual({ ok: false, claim })
  })
  it('returns the email and a numeric expiry when every check passes', () => {
    expect(checkClaims(claims(), new Set(emails))).toEqual({ ok: true, email: emails[0], expiresIn: 3600 })
  })
})

it('logs the failing claim by name and never the value', async () => {
  vi.mocked(fetch).mockResolvedValue(response({ ...claims(), expires_in: '10' }))
  const warn = vi.fn()
  app.addHook('onRequest', async (request) => {
    request.log.warn = warn
  })
  expect((await signIn()).statusCode).toBe(401)
  expect(warn).toHaveBeenCalledWith({ reason: 'tokeninfo_claims', claim: 'expires_in_too_short' }, '[test-signin] rejected')
  expect(JSON.stringify(warn.mock.calls)).not.toContain('opaque-secret')
})

it.each([{}, { accessToken: '' }, { accessToken: 1 }, { accessToken: '     ' }])('rejects malformed input %j', async (payload) => {
  expect((await signIn(payload)).statusCode).toBe(401)
  expect(fetch).not.toHaveBeenCalled()
})
it('accepts boolean verification, scope aliases and the five-minute boundary', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  try {
    vi.mocked(fetch).mockResolvedValue(response({ ...claims(), email_verified: true, scope: 'email profile', expires_in: 300 }))
    expect((await signIn()).statusCode).toBe(204)
  }
  finally { vi.useRealTimers() }
})
it.each([400, 401, 403, 302])('rejects tokeninfo status %s without retrying', async (status) => {
  vi.mocked(fetch).mockImplementation(async () => response({}, status))
  expect((await signIn()).statusCode).toBe(401)
  expect(fetch).toHaveBeenCalledTimes(1)
})
it('retries a transient failure once and succeeds', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('network'))
  expect((await signIn()).statusCode).toBe(204)
  expect(fetch).toHaveBeenCalledTimes(2)
})
it.each(['network', 'status', 'json'])('bounds retries for %s failures and returns a bare 401', async (kind) => {
  vi.mocked(fetch).mockImplementation(async () => {
    if (kind === 'network') throw new Error('timeout')
    return kind === 'status' ? response({}, 503) : new Response('not json')
  })
  const res = await signIn()
  expect(res.statusCode).toBe(401)
  expect(res.payload).toBe('')
  expect(fetch).toHaveBeenCalledTimes(2)
})
it('uses the marker-based limiter before token validation', async () => {
  await signIn({})
  await signIn({})
  const res = await signIn({})
  expect(res.statusCode).toBe(429)
  expect(res.json()).toEqual({ error: 'rate_limited' })
  expect(res.headers['retry-after']).toBeDefined()
})
it('blocks cross-site requests before minting a session', async () => {
  const res = await app.inject({ method: 'POST', url: '/auth/test-signin', headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' }, payload: { accessToken: 'opaque-secret' } })
  expect(res.statusCode).toBe(403)
  expect(fetch).not.toHaveBeenCalled()
})

describe('startup configuration', () => {
  beforeEach(() => {
    vi.stubEnv('DUOS_TEST_SIGNIN_ENABLED', 'true')
    vi.stubEnv('DUOS_TEST_SIGNIN_EMAILS', emails.join(','))
  })
  it.each(['staging', 'prod', 'production', 'local', '', undefined, 'bee-arbitrary'])('fails closed for env=%s even with BFF disabled', (env) => {
    expect(() => testSigninEmails({ env, bffEnabled: false })).toThrow('dev or BEE only')
  })
  it('accepts dev and BEE configuration', () => {
    expect(testSigninEmails({ env: 'dev', bffEnabled: true })).toEqual(new Set(emails))
  })
  it.each(['', 'false'])('leaves the route disabled with flag=%s', (flag) => {
    vi.stubEnv('DUOS_TEST_SIGNIN_ENABLED', flag)
    expect(testSigninEmails({ env: 'prod' })).toBeUndefined()
  })
  it('requires BFF mode rather than ignoring the flag', () => {
    expect(() => testSigninEmails({ env: 'dev' })).toThrow('requires bffEnabled')
  })
  it.each(['', ' , ', [...emails, 'user@gmail.com'].join(',')])('rejects an empty or non-SA allowlist %j', (value) => {
    vi.stubEnv('DUOS_TEST_SIGNIN_EMAILS', value)
    expect(() => testSigninEmails({ env: 'dev', bffEnabled: true })).toThrow('automation service-account emails')
  })
})
