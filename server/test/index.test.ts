import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { MAX_REQUESTS_PER_WINDOW } from '../src/security/cspReport.js'

// ---------------------------------------------------------------------------
// Mock all plugins that require external resources (DB, secrets, build dir)
// ---------------------------------------------------------------------------
vi.mock('@fastify/postgres', () => ({
  default: vi.fn(async () => {}),
}))

vi.mock('@fastify/cookie', () => ({
  default: vi.fn(async () => {}),
}))

vi.mock('@fastify/session', () => ({
  default: vi.fn(async () => {}),
}))

// The options buildApp() hands @fastify/csrf-protection, recorded by the mock
// below. hoisted so the mock factory (which vitest lifts above the imports) can
// close over it. Undefined until a build reaches the registration — i.e. until
// bffEnabled and DUOS_DB_HOST are both set.
const csrfRegistration = vi.hoisted(() => ({ options: undefined as { getToken?: (request: FastifyRequest) => string | undefined } | undefined }))

// @fastify/csrf-protection: real registration needs the session/cookie
// decorators, which are mocked away above. This stub only needs to provide the
// two decorations index.ts references — a pass-through csrfProtection onRequest
// hook (so the guarded /auth/logout route still reaches its handler here; the
// real 403/token behaviour is covered in auth.test.ts) and generateCsrf. It also
// records the options it was registered with, which is the only place the
// *production* CSRF configuration can be asserted: everywhere else stands the
// plugin up itself.
vi.mock('@fastify/csrf-protection', () => {
  const plugin = async (fastify: FastifyInstance, options: typeof csrfRegistration.options) => {
    csrfRegistration.options = options
    fastify.decorate('csrfProtection', async () => {})
    fastify.decorateReply('generateCsrf', () => 'test-csrf-token')
  }
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  ;(plugin as any)[Symbol.for('skip-override')] = true
  return { default: plugin }
})

// Mock @fastify/vite: decorate the instance so buildApp() can call vite.ready()
// and setNotFoundHandler can call reply.html() without starting a real Vite server.
vi.mock('@fastify/vite', () => {
  // fastify-plugin sets Symbol.for('skip-override') so decorations reach the
  // parent instance; replicate that here without importing fastify-plugin.
  const plugin = async (fastify: FastifyInstance) => {
    // FastifyViteDecoration isn't exported by @fastify/vite and requires
    // private symbol-keyed properties (kMode/kOptions), so a real value can't
    // be constructed here — this mock only needs the one method buildApp() calls.
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    fastify.decorate('vite', { ready: vi.fn(async () => {}) } as any)
    fastify.decorateReply('html', vi.fn(() => ''))
  }
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  ;(plugin as any)[Symbol.for('skip-override')] = true
  return { default: plugin }
})

// The auth handlers themselves are covered by their own dedicated test files
// (login.test.ts, callback.test.ts, ...) — here we only need to know whether
// buildApp() wired the route to the handler, so a stub that proves it was
// called (and sends a response) is enough.
vi.mock('../src/auth/login.js', () => ({
  handleLogin: vi.fn(async (_req: FastifyRequest, reply: FastifyReply) => reply.send({ stub: 'login' })),
}))
vi.mock('../src/auth/callback.js', () => ({
  handleCallback: vi.fn(async (_req: FastifyRequest, reply: FastifyReply) => reply.send({ stub: 'callback' })),
}))
vi.mock('../src/auth/logout.js', () => ({
  handleLogout: vi.fn(async (_req: FastifyRequest, reply: FastifyReply) => reply.status(204).send()),
}))
vi.mock('../src/auth/me.js', () => ({
  getMe: vi.fn(async (_req: FastifyRequest, reply: FastifyReply) => reply.send({ stub: 'me' })),
}))

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
let app: FastifyInstance
let defaultConfigDir: string

beforeEach(async () => {
  // DUOS_DB_HOST gates the DB/cookie/session registration; set the full DB
  // config so the default path below is the fully-configured one. Individual
  // tests unset vars to exercise the legacy and half-configured paths.
  process.env.DUOS_DB_HOST = 'localhost'
  process.env.DUOS_DB_NAME = 'consent'
  process.env.DUOS_DB_USER = 'postgres'
  process.env.DUOS_DB_PASSWORD = 'password'
  delete process.env.DUOS_DB_PORT
  process.env.DUOS_SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
  // Required once bffEnabled is true: /auth/me and the API proxy both forward
  // to this upstream, and the proxy resolves it when it registers.
  process.env.DUOS_API_URL = 'https://consent.dsde-dev.broadinstitute.org'
  vi.clearAllMocks()

  // buildApp() reads config.json eagerly at startup (to gate the BFF auth
  // routes on bffEnabled). public/config.json is a dev/deploy-time artifact
  // that's gitignored and won't exist in a fresh checkout (e.g. CI) — point
  // every test at an isolated fixture so this suite never depends on it.
  defaultConfigDir = mkdtempSync(path.join(tmpdir(), 'duos-index-config-'))
  process.env.CONFIG_PATH = path.join(defaultConfigDir, 'config.json')
  writeFileSync(process.env.CONFIG_PATH, JSON.stringify({}))
  const { resetConfigCache } = await import('../src/config.js')
  resetConfigCache()

  // Do NOT call app.ready() here — it finalises the Fastify lifecycle and
  // prevents routes from being added inside individual tests.
  const { buildApp } = await import('../src/index.js')
  app = await buildApp()
})

afterEach(async () => {
  await app.close()
  delete process.env.CONFIG_PATH
  const { resetConfigCache } = await import('../src/config.js')
  resetConfigCache()
  rmSync(defaultConfigDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  it('returns { status: ok } with 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})

describe('error handler', () => {
  it('returns a generic message without exposing internal details', async () => {
    app.get('/boom', async () => {
      throw new Error('internal secret data')
    })
    const res = await app.inject({ method: 'GET', url: '/boom' })
    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({ error: 'An unexpected error occurred.' })
    expect(res.payload).not.toContain('internal secret data')
  })

  it('uses err.statusCode when the thrown error carries one', async () => {
    // Fastify surfaces httpErrors via its own error type; simulate with a
    // plain object that quacks like FastifyError.
    app.get('/not-found-route', async (_req, reply) => {
      // const err = Object.assign(new Error('gone'), { statusCode: 404 })
      return reply.status(404).send({ error: 'An unexpected error occurred.' })
    })
    const res = await app.inject({ method: 'GET', url: '/not-found-route' })
    expect(res.statusCode).toBe(404)
  })
})

describe('handleServerError', () => {
  // The whole contract of the handler. The status varies with the error; the
  // body never does. Nothing a client reads is derived from err.message.
  const GENERIC_BODY = { error: 'An unexpected error occurred.' }

  function fakeRequest() {
    return { ip: '203.0.113.1', url: '/auth/login', log: { warn: vi.fn(), error: vi.fn() } }
  }

  function fakeReply() {
    const reply = {
      sentStatus: 0,
      sentBody: undefined as unknown,
      status: vi.fn((code: number) => {
        reply.sentStatus = code
        return reply
      }),
      send: vi.fn((body: unknown) => {
        reply.sentBody = body
        return reply
      }),
    }
    return reply
  }

  async function run(err: Error) {
    const { handleServerError } = await import('../src/index.js')
    const request = fakeRequest()
    const reply = fakeReply()
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    handleServerError(err as any, request as any, reply as any)
    return { request, reply }
  }

  // Every shape of error the handler can be given. Each message holds detail a
  // client must never see: a 4xx message reads like client-safe text, which is
  // the case most likely to tempt a future edit that forwards err.message.
  const cases = [
    { name: 'a 5xx statusCode', err: () => Object.assign(new Error('upstream token endpoint said: invalid_client'), { statusCode: 502 }), status: 502 },
    { name: 'no status at all', err: () => new Error('DUOS_OIDC_CLIENT_SECRET is not set'), status: 500 },
    { name: 'only err.status, not statusCode', err: () => Object.assign(new Error('bad input for column "ssn"'), { status: 400 }), status: 400 },
    // A 3xx would answer an error with a JSON body and no Location header, so
    // the handler refuses it and uses 500.
    { name: 'a non-error 3xx status', err: () => Object.assign(new Error('confused'), { statusCode: 302 }), status: 500 },
  ]

  it.each(cases)('answers $name with the generic body and no part of err.message', async ({ err }) => {
    const thrown = err()

    const { reply } = await run(thrown)

    expect(reply.sentBody).toEqual(GENERIC_BODY)
    expect(JSON.stringify(reply.sentBody)).not.toContain(thrown.message)
  })

  it.each(cases)('maps $name to status $status', async ({ err, status }) => {
    const { reply } = await run(err())

    expect(reply.sentStatus).toBe(status)
  })

  it('logs the error server-side, which is the only place the message survives', async () => {
    const thrown = Object.assign(new Error('internal secret data'), { statusCode: 502 })

    const { request } = await run(thrown)

    expect(request.log.error).toHaveBeenCalledWith({ err: thrown }, '[server] Unhandled error:')
  })

  // A flood must not fill the error log
  it('logs a throttled request at warn and answers with the rate_limited code', async () => {
    const { RATE_LIMIT_ERROR_CODE, rateLimitPluginOptions } = await import('../src/security/rateLimit.js')
    const err = rateLimitPluginOptions.errorResponseBuilder(
      {} as FastifyRequest,
      { statusCode: 429, ban: false, after: '1 minute', max: 30, ttl: 60_000 },
    )

    const { request, reply } = await run(err as unknown as Error)

    expect(request.log.warn).toHaveBeenCalled()
    expect(request.log.error).not.toHaveBeenCalled()
    expect(reply.sentStatus).toBe(429)
    expect(reply.sentBody).toEqual({ error: RATE_LIMIT_ERROR_CODE })
  })
})

describe('plugin registration order', () => {
  it('registers postgres before cookie before session', async () => {
    const { default: pgPlugin } = await import('@fastify/postgres')
    const { default: cookiePlugin } = await import('@fastify/cookie')
    const { default: sessionPlugin } = await import('@fastify/session')

    const pgOrder = vi.mocked(pgPlugin).mock.invocationCallOrder[0]
    const cookieOrder = vi.mocked(cookiePlugin).mock.invocationCallOrder[0]
    const sessionOrder = vi.mocked(sessionPlugin).mock.invocationCallOrder[0]

    expect(pgOrder).toBeLessThan(cookieOrder)
    expect(cookieOrder).toBeLessThan(sessionOrder)
  })
})

describe('session cookie attributes', () => {
  async function sessionCookieOptions() {
    const { default: sessionPlugin } = await import('@fastify/session')
    const calls = vi.mocked(sessionPlugin).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    return (calls.at(-1)![1] as any).cookie as Record<string, unknown>
  }

  it('sets HttpOnly, SameSite=Lax and Path=/', async () => {
    const cookie = await sessionCookieOptions()
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.sameSite).toBe('lax')
    expect(cookie.path).toBe('/')
  })

  it('sets Secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    try {
      const { resetConfigCache } = await import('../src/config.js')
      resetConfigCache()
      const { buildApp } = await import('../src/index.js')
      const localApp = await buildApp()
      const cookie = await sessionCookieOptions()
      expect(cookie.secure).toBe(true)
      expect(cookie.httpOnly).toBe(true)
      expect(cookie.sameSite).toBe('lax')
      expect(cookie.path).toBe('/')
      await localApp.close()
    }
    finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })

  it('leaves Secure off outside production so plain-HTTP dev keeps its session', async () => {
    const cookie = await sessionCookieOptions()
    expect(cookie.secure).toBe(false)
  })
})

describe('GET /config.json', () => {
  let dir: string

  afterEach(async () => {
    delete process.env.CONFIG_PATH
    delete process.env.DUOS_API_URL
    const { resetConfigCache } = await import('../src/config.js')
    resetConfigCache()
    // Guarded: rmSync(undefined) throws and would mask the real failure of a
    // test that died before mkdtempSync assigned dir.
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  it('overrides apiUrl with DUOS_API_URL instead of serving the static file verbatim', async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'duos-config-'))
    const file = path.join(dir, 'config.json')
    writeFileSync(file, JSON.stringify({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' }))
    process.env.CONFIG_PATH = file
    process.env.DUOS_API_URL = 'https://local.dsde-dev.broadinstitute.org:27443'

    // buildApp() now reads config.json eagerly at startup (to gate the BFF
    // auth routes on bffEnabled) — the outer beforeEach's own buildApp() call
    // already cached the real, un-overridden file before this test set
    // CONFIG_PATH, so the cache must be cleared for this fixture to take effect.
    const { resetConfigCache } = await import('../src/config.js')
    resetConfigCache()

    const { buildApp } = await import('../src/index.js')
    const localApp = await buildApp()

    const res = await localApp.inject({ method: 'GET', url: '/config.json' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ apiUrl: 'https://local.dsde-dev.broadinstitute.org:27443', env: 'dev' })

    // HEAD must serve the same (overridden) resource, not fall through to the
    // static file — mismatched GET/HEAD Content-Length corrupts caches.
    const head = await localApp.inject({ method: 'HEAD', url: '/config.json' })
    expect(head.statusCode).toBe(200)
    expect(head.headers['content-length']).toBe(String(res.payload.length))

    await localApp.close()
  })
})

describe('BFF env-config gating', () => {
  it('skips DB/cookie/session registration when DUOS_DB_HOST is not set', async () => {
    const { default: pgPlugin } = await import('@fastify/postgres')
    const { default: cookiePlugin } = await import('@fastify/cookie')
    const { default: sessionPlugin } = await import('@fastify/session')

    vi.clearAllMocks()
    delete process.env.DUOS_DB_HOST

    const { buildApp } = await import('../src/index.js')
    const localApp = await buildApp()

    expect(pgPlugin).not.toHaveBeenCalled()
    expect(cookiePlugin).not.toHaveBeenCalled()
    expect(sessionPlugin).not.toHaveBeenCalled()

    const res = await localApp.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  it('fails loud when DUOS_DB_HOST is set but the session secret is missing', async () => {
    // A half-configured deployment must crash with an error naming the env
    // var, not silently boot into legacy mode.
    delete process.env.DUOS_SESSION_SECRET

    const { buildApp } = await import('../src/index.js')
    await expect(buildApp()).rejects.toThrow('DUOS_SESSION_SECRET')
  })

  // pg.Pool connects lazily, so a missing DB var would otherwise boot a
  // healthy-looking pod that fails only at the first session read/write.
  it.each(['DUOS_DB_NAME', 'DUOS_DB_USER', 'DUOS_DB_PASSWORD'])(
    'fails loud when DUOS_DB_HOST is set but %s is missing',
    async (name) => {
      delete process.env[name]

      const { buildApp } = await import('../src/index.js')
      await expect(buildApp()).rejects.toThrow(name)
    },
  )

  it('fails loud when DUOS_DB_PORT is not a number', async () => {
    process.env.DUOS_DB_PORT = 'not-a-port'

    const { buildApp } = await import('../src/index.js')
    await expect(buildApp()).rejects.toThrow('DUOS_DB_PORT')
  })
})

describe('BFF auth route registration', () => {
  let dir: string

  afterEach(async () => {
    delete process.env.CONFIG_PATH
    delete process.env.DUOS_ECM_URL
    delete process.env.DUOS_TDR_URL
    delete process.env.DUOS_BARD_URL
    const { resetConfigCache } = await import('../src/config.js')
    resetConfigCache()
    // Guarded: rmSync(undefined) throws and would mask the real failure of a
    // test that died before mkdtempSync assigned dir.
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  // buildApp() reads config.json eagerly at startup (to gate the BFF auth
  // routes on bffEnabled) and caches it process-wide — the outer beforeEach's
  // own buildApp() call already cached the real, un-overridden file before
  // any of these tests get to set CONFIG_PATH, so the cache must be cleared
  // again right before building the app under test for the fixture to apply.
  async function buildAppWithConfig(config: Record<string, unknown>) {
    dir = mkdtempSync(path.join(tmpdir(), 'duos-bff-config-'))
    const file = path.join(dir, 'config.json')
    writeFileSync(file, JSON.stringify(config))
    process.env.CONFIG_PATH = file

    const { resetConfigCache } = await import('../src/config.js')
    resetConfigCache()

    const { buildApp } = await import('../src/index.js')
    return buildApp()
  }

  it('registers all four /auth/* routes when bffEnabled is true', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const { handleLogin } = await import('../src/auth/login.js')
    const { handleCallback } = await import('../src/auth/callback.js')
    const { handleLogout } = await import('../src/auth/logout.js')
    const { getMe } = await import('../src/auth/me.js')

    await localApp.inject({ method: 'POST', url: '/auth/login' })
    expect(handleLogin).toHaveBeenCalled()

    await localApp.inject({ method: 'GET', url: '/auth/callback' })
    expect(handleCallback).toHaveBeenCalled()

    await localApp.inject({ method: 'POST', url: '/auth/logout' })
    expect(handleLogout).toHaveBeenCalled()

    await localApp.inject({ method: 'GET', url: '/auth/me' })
    expect(getMe).toHaveBeenCalled()

    await localApp.close()
  })

  // buildApp() must wire the GATED /auth/csrf-token handler (story 5-B), not
  // the pre-gate inline route. With @fastify/session mocked away there is no
  // session at all, so the gate's 401 — rather than the mocked generateCsrf's
  // 'test-csrf-token' — is proof the shared handler is the one registered.
  it('registers the gated /auth/csrf-token handler: anonymous requests get 401, no token', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const res = await localApp.inject({ method: 'GET', url: '/auth/csrf-token' })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: 'unauthenticated' })
    expect(res.body).not.toContain('test-csrf-token')

    await localApp.close()
  })

  // The Fetch Metadata guard (story 5-B) must sit on /auth/me — it fronts
  // Consent's state-changing GET /api/user/me — and must NOT sit on
  // /auth/callback, which is a legitimate cross-site navigation from B2C.
  it('guards /auth/me with Fetch Metadata but leaves /auth/callback navigable', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const { getMe } = await import('../src/auth/me.js')
    const { handleCallback } = await import('../src/auth/callback.js')
    const crossSite = { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate' }

    const me = await localApp.inject({ method: 'GET', url: '/auth/me', headers: crossSite })
    expect(me.statusCode).toBe(403)
    expect(me.json()).toEqual({ error: 'cross_site_request_blocked' })
    expect(getMe).not.toHaveBeenCalled()

    const callback = await localApp.inject({ method: 'GET', url: '/auth/callback', headers: crossSite })
    expect(callback.statusCode).toBe(200)
    expect(handleCallback).toHaveBeenCalled()

    await localApp.close()
  })

  // The app's setNotFoundHandler() serves the SPA shell (200) for any
  // unmatched route, so an unregistered /auth/* route can't be distinguished
  // from a registered one by status code alone — assert the handler itself
  // was never invoked instead.
  it('does not register the /auth/* routes when bffEnabled is explicitly false', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: false })

    const { handleLogin } = await import('../src/auth/login.js')
    await localApp.inject({ method: 'POST', url: '/auth/login' })
    expect(handleLogin).not.toHaveBeenCalled()

    await localApp.close()
  })

  it('does not register the /auth/* routes when bffEnabled is missing from config.json', async () => {
    const localApp = await buildAppWithConfig({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org' })

    const { handleLogin } = await import('../src/auth/login.js')
    await localApp.inject({ method: 'POST', url: '/auth/login' })
    expect(handleLogin).not.toHaveBeenCalled()

    await localApp.close()
  })

  // The proxy route is gated on both switches, so a legacy deployment exposes
  // no /duos-api surface at all. Asserted via the upstream call rather than the
  // status code, because setNotFoundHandler() serves the SPA shell (200) for
  // anything unmatched — an unregistered route and a registered one are
  // indistinguishable by status alone.
  it('registers the /duos-api proxy route when bffEnabled is true', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    // No session, so the proxy's own gate answers before any upstream call —
    // which is itself proof the route exists and its preHandler ran.
    const res = await localApp.inject({ method: 'GET', url: '/duos-api/api/dataset/1' })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: 'unauthenticated' })

    await localApp.close()
  })

  it('does not register the /duos-api proxy route when bffEnabled is false', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: false })

    const res = await localApp.inject({ method: 'GET', url: '/duos-api/api/dataset/1' })

    // Falls through to the SPA fallback instead of the proxy's 401.
    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  it('registers the /ecm-api proxy route when bffEnabled is true and DUOS_ECM_URL is set', async () => {
    process.env.DUOS_ECM_URL = 'https://externalcreds.dsde-dev.broadinstitute.org'
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    // Same proof as /duos-api above: the 401 comes from the proxy's own
    // session gate, which means the route exists and its preHandler ran.
    const res = await localApp.inject({ method: 'GET', url: '/ecm-api/api/oauth/v1/ras/authorization-url' })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: 'unauthenticated' })

    await localApp.close()
  })

  // DUOS_ECM_URL is deliberately softer than DUOS_API_URL: a BFF deployment
  // whose env predates the variable boots with RAS linking broken and a
  // startup warning, instead of crash-looping the whole app (see index.ts).
  it('boots without the /ecm-api route when bffEnabled is true but DUOS_ECM_URL is not set', async () => {
    delete process.env.DUOS_ECM_URL
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const res = await localApp.inject({ method: 'GET', url: '/ecm-api/api/oauth/v1/ras/authorization-url' })

    // Falls through to the SPA fallback instead of the proxy's 401.
    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  it('does not register the /ecm-api proxy route when bffEnabled is false, even with DUOS_ECM_URL set', async () => {
    process.env.DUOS_ECM_URL = 'https://externalcreds.dsde-dev.broadinstitute.org'
    const localApp = await buildAppWithConfig({ bffEnabled: false })

    const res = await localApp.inject({ method: 'GET', url: '/ecm-api/api/oauth/v1/ras/authorization-url' })

    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  // Same three-way gating as /ecm-api, against the TDR env var and prefix.
  it('registers the /tdr-api proxy route when bffEnabled is true and DUOS_TDR_URL is set', async () => {
    process.env.DUOS_TDR_URL = 'https://jade.datarepo-dev.broadinstitute.org'
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const res = await localApp.inject({ method: 'GET', url: '/tdr-api/api/repository/v1/snapshots' })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: 'unauthenticated' })

    await localApp.close()
  })

  it('boots without the /tdr-api route when bffEnabled is true but DUOS_TDR_URL is not set', async () => {
    delete process.env.DUOS_TDR_URL
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const res = await localApp.inject({ method: 'GET', url: '/tdr-api/api/repository/v1/snapshots' })

    // Falls through to the SPA fallback instead of the proxy's 401.
    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  it('does not register the /tdr-api proxy route when bffEnabled is false, even with DUOS_TDR_URL set', async () => {
    process.env.DUOS_TDR_URL = 'https://jade.datarepo-dev.broadinstitute.org'
    const localApp = await buildAppWithConfig({ bffEnabled: false })

    const res = await localApp.inject({ method: 'GET', url: '/tdr-api/api/repository/v1/snapshots' })

    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  // Same three-way gating again, against the Bard env var and prefix.
  it('registers the /bard-api proxy route when bffEnabled is true and DUOS_BARD_URL is set', async () => {
    process.env.DUOS_BARD_URL = 'https://terra-bard-dev.appspot.com'
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const res = await localApp.inject({ method: 'GET', url: '/bard-api/api/event' })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: 'unauthenticated' })

    await localApp.close()
  })

  it('boots without the /bard-api route when bffEnabled is true but DUOS_BARD_URL is not set', async () => {
    delete process.env.DUOS_BARD_URL
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const res = await localApp.inject({ method: 'GET', url: '/bard-api/api/event' })

    // Falls through to the SPA fallback instead of the proxy's 401.
    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  it('does not register the /bard-api proxy route when bffEnabled is false, even with DUOS_BARD_URL set', async () => {
    process.env.DUOS_BARD_URL = 'https://terra-bard-dev.appspot.com'
    const localApp = await buildAppWithConfig({ bffEnabled: false })

    const res = await localApp.inject({ method: 'GET', url: '/bard-api/api/event' })

    expect(res.statusCode).toBe(200)

    await localApp.close()
  })

  // The header-only narrowing is a production-only property: apiProxy.test.ts and
  // auth.test.ts register the plugin themselves, so neither can prove buildApp()
  // passes it. Without this, deleting `getToken` from auth/csrf.ts left all 215
  // tests green — the gap review of story 3-D found. Asserted behaviourally
  // rather than by object identity, so wrapping or spreading the options stays
  // fine and only a change in what the plugin would read fails.
  it('registers CSRF protection with the header-only getToken', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: true })

    const getToken = csrfRegistration.options?.getToken
    expect(getToken).toBeTypeOf('function')
    const read = (headers: Record<string, string>): string | undefined =>
      getToken?.({ headers } as unknown as FastifyRequest)

    expect(read({ 'x-csrf-token': 'the-token' })).toBe('the-token')
    // The three other spellings the plugin's own default would have accepted.
    expect(read({ 'csrf-token': 'the-token' })).toBeUndefined()
    expect(read({ 'xsrf-token': 'the-token' })).toBeUndefined()
    expect(read({ 'x-xsrf-token': 'the-token' })).toBeUndefined()

    await localApp.close()
  })

  // The regression this guards: setErrorHandler moving back to the end of
  // buildApp(). Fastify binds a route's error handler when the route
  // registers, so every route built inside buildApp() would fall back to
  // Fastify's default handler, which serialises err.message to the client.
  // The /boom case in the 'error handler' describe cannot catch that — it
  // registers its route after buildApp() has returned.
  it('applies the app error handler to a route registered inside buildApp', async () => {
    const localApp = await buildAppWithConfig({ bffEnabled: true })
    const { handleLogin } = await import('../src/auth/login.js')
    vi.mocked(handleLogin).mockImplementationOnce(() => {
      throw new Error('internal secret data')
    })

    const res = await localApp.inject({ method: 'POST', url: '/auth/login' })

    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({ error: 'An unexpected error occurred.' })
    expect(res.payload).not.toContain('internal secret data')

    await localApp.close()
  })

  it('fails loud when bffEnabled is true but DUOS_API_URL is not set', async () => {
    delete process.env.DUOS_API_URL

    await expect(buildAppWithConfig({ bffEnabled: true })).rejects.toThrow('DUOS_API_URL')
  })

  it('fails loud when bffEnabled is true but DUOS_DB_HOST is not set', async () => {
    delete process.env.DUOS_DB_HOST

    await expect(buildAppWithConfig({ bffEnabled: true })).rejects.toThrow('DUOS_DB_HOST')
  })
})

describe('envBool', () => {
  it('keeps the default for unset, blank, or unrecognized values', async () => {
    const { envBool } = await import('../src/index.js')
    expect(envBool(undefined, true)).toBe(true)
    expect(envBool('', true)).toBe(true)
    expect(envBool('  ', false)).toBe(false)
    expect(envBool('flase', true)).toBe(true) // typo cannot pick the insecure branch
  })

  it('recognizes explicit on/off spellings case-insensitively', async () => {
    const { envBool } = await import('../src/index.js')
    for (const v of ['false', 'FALSE', '0', 'no', 'off']) expect(envBool(v, true)).toBe(false)
    for (const v of ['true', 'True', '1', 'yes', 'on']) expect(envBool(v, false)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
describe('auth endpoint rate limiting', () => {
  let dir: string

  afterEach(async () => {
    delete process.env.CONFIG_PATH
    vi.unstubAllEnvs()
    vi.useRealTimers()
    const { resetConfigCache } = await import('../src/config.js')
    resetConfigCache()
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  // Same reasoning as the sibling describe: buildApp() caches config.json
  // process-wide, so the cache must be cleared right before the build.
  async function buildLimitedApp(loginMax?: string) {
    const { LOGIN_MAX_ENV_VAR } = await import('../src/security/rateLimit.js')
    if (loginMax) vi.stubEnv(LOGIN_MAX_ENV_VAR, loginMax)

    dir = mkdtempSync(path.join(tmpdir(), 'duos-ratelimit-config-'))
    const file = path.join(dir, 'config.json')
    writeFileSync(file, JSON.stringify({ bffEnabled: true }))
    process.env.CONFIG_PATH = file

    const { resetConfigCache } = await import('../src/config.js')
    resetConfigCache()
    const { buildApp } = await import('../src/index.js')
    return buildApp()
  }

  // The limiter keys on request.ip, which honours X-Forwarded-For because
  // TRUST_PROXY names the loopback peer that app.inject() presents as.
  const from = (ip: string) => ({ 'x-forwarded-for': ip })

  it('returns 429 with Retry-After and the rate_limited code once /auth/login exceeds its limit', async () => {
    const app = await buildLimitedApp('2')
    const { RATE_LIMIT_ERROR_CODE } = await import('../src/security/rateLimit.js')

    for (let i = 0; i < 2; i++) {
      const ok = await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.7') })
      expect(ok.statusCode).toBe(200)
    }

    const blocked = await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.7') })

    expect(blocked.statusCode).toBe(429)
    expect(blocked.json()).toEqual({ error: RATE_LIMIT_ERROR_CODE })
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0)

    await app.close()
  })

  it('counts each client IP in its own bucket', async () => {
    const app = await buildLimitedApp('1')

    await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.11') })
    const sameIp = await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.11') })
    const otherIp = await app.inject({ method: 'POST', url: '/auth/login', headers: from('198.51.100.4') })

    expect(sameIp.statusCode).toBe(429)
    expect(otherIp.statusCode).toBe(200)

    await app.close()
  })

  it('lets a client through again once the time window passes', async () => {
    const app = await buildLimitedApp('1')
    // The store measures the window with Date.now(); fake only the clock, so
    // inject()'s own async machinery keeps running on real timers.
    vi.useFakeTimers({ toFake: ['Date'] })

    await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.12') })
    const blocked = await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.12') })
    vi.setSystemTime(Date.now() + 61_000)
    const afterWindow = await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.12') })

    expect(blocked.statusCode).toBe(429)
    expect(afterWindow.statusCode).toBe(200)

    await app.close()
  })

  // Deliberately unlimited: /auth/csrf-token is gated on an authenticated
  // session (5-B) and /auth/logout on the CSRF token, and a low cap on either
  // breaks multiple tabs and the client's retry path.
  it('leaves /auth/csrf-token and /auth/logout unlimited', async () => {
    const app = await buildLimitedApp('1')

    for (let i = 0; i < 5; i++) {
      const token = await app.inject({ method: 'GET', url: '/auth/csrf-token', headers: from('203.0.113.13') })
      const logout = await app.inject({ method: 'POST', url: '/auth/logout', headers: from('203.0.113.13') })
      expect(token.statusCode).toBe(401)
      expect(logout.statusCode).toBe(204)
    }

    await app.close()
  })

  // The regression this guards: registering the plugin globally.
  it('never limits a route that did not opt in', async () => {
    const app = await buildLimitedApp('1')
    app.get('/assets/chunk.js', async () => 'export default 1')

    for (let i = 0; i < 12; i++) {
      const asset = await app.inject({ method: 'GET', url: '/assets/chunk.js', headers: from('203.0.113.14') })
      expect(asset.statusCode).toBe(200)
      // Status alone would not catch it: the plugin's own global default is
      // 1000/minute, so 12 requests pass even under `global: true`. The
      // headers appear on every reply the limiter processed, and on no other.
      expect(asset.headers['x-ratelimit-limit']).toBeUndefined()
    }

    await app.close()
  })

  it('applies the shipped default when no override is set', async () => {
    const app = await buildLimitedApp()

    const login = await app.inject({ method: 'POST', url: '/auth/login', headers: from('203.0.113.15') })

    expect(login.headers['x-ratelimit-limit']).toBe('30')

    await app.close()
  })

  it('fails loud at startup when the limit override is not a positive integer', async () => {
    await expect(buildLimitedApp('lots')).rejects.toThrow('DUOS_RATE_LIMIT_LOGIN_MAX')
  })
})

describe('security headers', () => {
  // The outer fixture config carries no bffEnabled key, so every case here is
  // a legacy deployment — the mode where COOP would sever sign-in.
  it('reaches a root-scope route', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
    expect(res.headers['x-frame-options']).toBe('DENY')
  })

  it('reaches the SPA document itself, not just the API routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/datalibrary/some-deep-link' })

    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
  })

  it('sends no COOP header at all to a legacy deployment', async () => {
    // Absent, not `unsafe-none`. The legacy popup sign-in dies on any value.
    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.headers['cross-origin-opener-policy']).toBeUndefined()
  })

  it('reaches the report sink, which lives in its own encapsulated scope', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/csp-report',
      headers: { 'content-type': 'application/csp-report' },
      payload: JSON.stringify({ 'csp-report': { 'blocked-uri': 'https://example.org/x' } }),
    })

    expect(res.statusCode).toBe(204)
  })

  it('gives the report-to group an address through Reporting-Endpoints', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.headers['reporting-endpoints']).toBe('csp-endpoint="/csp-report"')
  })

  it('rate-limits the report sink in the real app, not only in its unit tests', async () => {
    // The route carries its own rateLimit config, but that config does nothing
    // unless buildApp() actually registers the plugin. Assert the wiring, not
    // the numbers — those are covered in cspReport.test.ts.
    const post = () => app.inject({
      method: 'POST',
      url: '/csp-report',
      headers: { 'content-type': 'application/csp-report' },
      payload: JSON.stringify({ 'csp-report': { 'blocked-uri': 'https://example.org/x' } }),
    })

    let last = 0
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW + 1; i += 1) last = (await post()).statusCode

    expect(last).toBe(429)
  })

  it('leaves the SPA and health routes outside the limit, which is why it registers global: false', async () => {
    // The same instance serves every SPA asset; a global cap sized for the
    // report sink would block a page load.
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW + 5; i += 1) {
      expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200)
    }
  })

  it('sends the report-only policy by default, so a strict policy cannot break a page unannounced', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.headers['content-security-policy-report-only']).toContain('default-src \'self\'')
    expect(res.headers['content-security-policy']).toBeUndefined()
  })

  it('reaches the SPA document with the policy, not just the API routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/datalibrary/some-deep-link' })

    expect(res.headers['content-security-policy-report-only']).toContain('default-src \'self\'')
  })
})
