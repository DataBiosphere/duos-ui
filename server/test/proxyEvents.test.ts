import { Writable } from 'node:stream'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { RefreshFailedError } from '../src/auth/refresh.js'
import { buildLoggerOptions } from '../src/logging.js'
import { PROXY_PREFIX, apiProxy } from '../src/proxy/apiProxy.js'
import { ecmProxy, ECM_PROXY_PREFIX } from '../src/proxy/ecmProxy.js'
import { buildAppShell, nowSeconds, seedSession, startUpstream, type SessionSeed, type Upstream } from './proxyTestHarness.js'

vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

type LogEntry = Record<string, unknown>

describe('proxy.completed', () => {
  let upstream: Upstream
  let app: FastifyInstance | undefined
  let lines: string[]

  const completed = (): LogEntry[] => lines.map(line => JSON.parse(line) as LogEntry).filter(entry => entry.event === 'proxy.completed')

  async function build(seed: SessionSeed | undefined, register: typeof apiProxy = apiProxy): Promise<FastifyInstance> {
    const stream = new Writable({
      write(chunk, _enc, done) {
        lines.push(...chunk.toString().split('\n').filter(Boolean))
        done()
      },
    })
    const shell = await buildAppShell({ ...buildLoggerOptions(), level: 'info', stream })
    if (seed) seedSession(shell, seed)
    await shell.register(register)
    return shell
  }

  const freshSession = (): SessionSeed => ({ accessToken: 'session-access-token', tokenExpiry: nowSeconds() + 3600 })

  beforeEach(async () => {
    lines = []
    upstream = await startUpstream()
    process.env.DUOS_API_URL = upstream.origin
    process.env.DUOS_ECM_URL = upstream.origin
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await upstream.close()
    delete process.env.DUOS_API_URL
    delete process.env.DUOS_ECM_URL
  })

  it('emits one event per forwarded request with the status, upstream and had_session', async () => {
    app = await build(freshSession())

    await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

    expect(completed()).toEqual([expect.objectContaining({ status: 200, upstream: 'duos', had_session: true, idp: 'unknown', severity: 'INFO' })])
    expect(completed()[0]).not.toHaveProperty('error_code')
  })

  it('labels each proxy with its own upstream', async () => {
    app = await build(freshSession(), ecmProxy)

    await app.inject({ method: 'GET', url: `${ECM_PROXY_PREFIX}/api/x` })

    expect(completed()).toEqual([expect.objectContaining({ upstream: 'ecm' })])
  })

  it('records had_session false and an error_code for a request the BFF rejects without a session', async () => {
    app = await build(undefined)

    await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

    expect(completed()).toEqual([expect.objectContaining({ status: 401, had_session: false, error_code: 'unauthenticated' })])
  })

  it('records had_session true even though an upstream 401 destroys the session before the response', async () => {
    app = await build(freshSession())
    upstream.respondWith((_req, res) => {
      res.writeHead(401, { 'content-type': 'application/json' })
      res.end('{"message":"Unauthorized"}')
    })

    await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

    expect(completed()).toEqual([expect.objectContaining({ status: 401, had_session: true, error_code: 'session_expired' })])
  })

  it('records a terminal refresh failure and a transient one with distinct error codes', async () => {
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    const stale: SessionSeed = { accessToken: 'session-access-token', tokenExpiry: nowSeconds() + 5 }
    app = await build(stale)
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(new RefreshFailedError('refresh_failed'))
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(new Error('network down'))

    await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })
    await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

    expect(completed().map(entry => [entry.status, entry.error_code])).toEqual([[401, 'session_expired'], [502, 'upstream_unavailable']])
  })

  it('records a request blocked by Fetch Metadata, and a CSRF rejection with its own event', async () => {
    app = await build(freshSession())

    await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1`, headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' } })
    await app.inject({ method: 'POST', url: `${PROXY_PREFIX}/api/dataset`, payload: '{}', headers: { 'content-type': 'application/json' } })

    expect(completed().map(entry => [entry.status, entry.error_code])).toEqual([[403, 'cross_site_request_blocked'], [403, 'csrf_validation_failed']])
    const rejected = lines.map(line => JSON.parse(line) as LogEntry).filter(entry => entry.event === 'proxy.csrf.rejected')
    expect(rejected).toEqual([expect.objectContaining({ reason: expect.any(String), idp: 'unknown', severity: 'INFO' })])
  })
})
