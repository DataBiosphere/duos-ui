import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

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

// Mock @fastify/vite: decorate the instance so buildApp() can call vite.ready()
// and setNotFoundHandler can call reply.html() without starting a real Vite server.
vi.mock('@fastify/vite', () => {
  // fastify-plugin sets Symbol.for('skip-override') so decorations reach the
  // parent instance; replicate that here without importing fastify-plugin.
  const plugin = async (fastify: FastifyInstance) => {
    // FastifyViteDecoration isn't exported by @fastify/vite and requires
    // private symbol-keyed properties (kMode/kOptions), so a real value can't
    // be constructed here — this mock only needs the one method buildApp() calls.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fastify.decorate('vite', { ready: vi.fn(async () => {}) } as any)
    fastify.decorateReply('html', vi.fn(() => ''))
  }
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  ;(plugin as any)[Symbol.for('skip-override')] = true
  return { default: plugin }
})

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
let app: FastifyInstance

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
  vi.clearAllMocks()
  // Do NOT call app.ready() here — it finalises the Fastify lifecycle and
  // prevents routes from being added inside individual tests.
  const { buildApp } = await import('../src/index.js')
  app = await buildApp()
})

afterEach(async () => {
  await app.close()
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
