import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyRateLimit from '@fastify/rate-limit'
import {
  PUBLIC_SHOWCASE_DATASETS_PATH,
  SHOWCASE_BODY_LIMIT,
  SHOWCASE_MAX_PER_WINDOW,
  publicProxy,
} from '../src/proxy/publicProxy.js'
import { TRUST_PROXY } from '../src/config.js'
import {
  type Upstream,
  buildAppShell,
  csrfCredentials,
  seedSession,
  startUpstream,
} from './proxyTestHarness.js'

// Synthetic request from test/fixtures/showcase/contracts.ts.
const LOOKUP = '{"mode":"identifiers","section":"open-access-datasets","identifiers":["DUOS-000123","DUOS-000999"]}'

const JSON_HEADERS = { 'content-type': 'application/json' }

/** A JSON body of exactly `bytes` bytes. */
function jsonBodyOfSize(bytes: number): string {
  const frame = '{"pad":""}'
  return `{"pad":"${'x'.repeat(bytes - frame.length)}"}`
}

describe('publicProxy: showcase catalog lookup', () => {
  let showcase: Upstream
  let api: Upstream
  let app: FastifyInstance | undefined

  beforeEach(async () => {
    showcase = await startUpstream()
    api = await startUpstream()
    process.env.DUOS_SHOWCASE_API_URL = showcase.origin
    process.env.DUOS_API_URL = api.origin
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await showcase.close()
    await api.close()
    delete process.env.DUOS_SHOWCASE_API_URL
    delete process.env.DUOS_API_URL
  })

  async function buildPublicApp(logLines?: string[]): Promise<FastifyInstance> {
    const logger = logLines
      ? { level: 'info', stream: { write: (line: string) => { logLines.push(line) } } }
      : false
    const instance = Fastify({ logger, trustProxy: TRUST_PROXY })
    await instance.register(fastifyRateLimit, { global: false })
    await instance.register(publicProxy)
    return instance
  }

  const lookup = (instance: FastifyInstance, headers: Record<string, string> = {}, payload = LOOKUP) =>
    instance.inject({ method: 'POST', url: PUBLIC_SHOWCASE_DATASETS_PATH, headers: { ...JSON_HEADERS, ...headers }, payload })

  describe('routing', () => {
    it('forwards the body byte-for-byte to POST /showcase/datasets on the showcase upstream', async () => {
      app = await buildPublicApp()

      const res = await lookup(app)

      expect(res.statusCode).toBe(200)
      expect(showcase.last().method).toBe('POST')
      expect(showcase.last().url).toBe('/showcase/datasets')
      expect(showcase.last().headers['content-type']).toBe('application/json')
      expect(showcase.last().body.toString()).toBe(LOOKUP)
      expect(api.received).toHaveLength(0)
    })

    it('drops a caller-supplied query string, so the upstream sees only the fixed path', async () => {
      app = await buildPublicApp()

      await app.inject({ method: 'POST', url: `${PUBLIC_SHOWCASE_DATASETS_PATH}?mode=all`, headers: JSON_HEADERS, payload: LOOKUP })

      expect(showcase.last().url).toBe('/showcase/datasets')
    })

    it('exposes no GET and no other showcase path', async () => {
      app = await buildPublicApp()

      const get = await app.inject({ method: 'GET', url: PUBLIC_SHOWCASE_DATASETS_PATH })
      const other = await app.inject({ method: 'POST', url: '/public/showcase/stats', headers: JSON_HEADERS, payload: '{}' })

      expect(get.statusCode).toBe(404)
      expect(other.statusCode).toBe(404)
      expect(showcase.received).toHaveLength(0)
    })
  })

  describe('the request leg', () => {
    it('strips the session cookie, Authorization and the CSRF token, and injects x-app-id', async () => {
      const shell = await buildAppShell()
      await shell.register(fastifyRateLimit, { global: false })
      seedSession(shell, { accessToken: 'a-live-session-access-token', tokenExpiry: Math.floor(Date.now() / 1000) + 3600 })
      await shell.register(publicProxy)
      app = shell
      const { cookie, token } = await csrfCredentials(app)

      const res = await lookup(app, { 'cookie': cookie, 'x-csrf-token': token, 'authorization': 'Bearer browser-held-token' })

      expect(res.statusCode).toBe(200)
      const forwarded = showcase.last().headers
      expect(forwarded.cookie).toBeUndefined()
      expect(forwarded.authorization).toBeUndefined()
      expect(forwarded['x-csrf-token']).toBeUndefined()
      expect(forwarded['x-app-id']).toBe('DUOS')
    })

    it('appends this pod to the forwarded-for chain', async () => {
      app = await buildPublicApp()

      await lookup(app, { 'x-forwarded-for': '203.0.113.7' })

      expect(showcase.last().headers['x-forwarded-for']).toBe('203.0.113.7, 127.0.0.1')
    })

    it('needs no CSRF token and no same-origin Fetch Metadata', async () => {
      app = await buildPublicApp()

      const res = await lookup(app, { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' })

      expect(res.statusCode).toBe(200)
    })
  })

  describe('the response leg', () => {
    it('strips set-cookie and www-authenticate, and adds the hardening headers', async () => {
      app = await buildPublicApp()
      showcase.respondWith((_req, res) => {
        res.writeHead(200, {
          'set-cookie': 'sessionId=upstream-forged; Path=/',
          'www-authenticate': 'Bearer realm="consent"',
          'content-type': 'application/json',
        })
        res.end('{"datasets":[]}')
      })

      const res = await lookup(app)

      expect(res.headers['set-cookie']).toBeUndefined()
      expect(res.headers['www-authenticate']).toBeUndefined()
      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(res.headers['content-security-policy']).toBe('sandbox')
      expect(res.json()).toEqual({ datasets: [] })
    })

    it('passes a Consent validation error through with its JSON message intact', async () => {
      app = await buildPublicApp()
      const message = { message: 'Identifier "DUOS-123" is not canonical; use "DUOS-000123"' }
      showcase.respondWith((_req, res) => {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(JSON.stringify(message))
      })

      const res = await lookup(app)

      expect(res.statusCode).toBe(400)
      expect(res.json()).toEqual(message)
    })

    it('passes the Consent rate limit through as 429 with its Retry-After', async () => {
      // Consent's PublicRateLimitFilter answers 429 with Retry-After and no body.
      app = await buildPublicApp()
      showcase.respondWith((_req, res) => {
        res.writeHead(429, { 'retry-after': '17', 'content-length': '0' })
        res.end()
      })

      const res = await lookup(app)

      expect(res.statusCode).toBe(429)
      expect(res.headers['retry-after']).toBe('17')
    })

    it('answers 502 rather than streaming a non-JSON upstream body onto this origin', async () => {
      app = await buildPublicApp()
      showcase.respondWith((_req, res) => {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<script>alert(1)</script>')
      })

      const res = await lookup(app)

      expect(res.statusCode).toBe(502)
      expect(res.json()).toEqual({ error: 'upstream_not_json' })
    })

    it('reports an unreachable upstream as 502', async () => {
      app = await buildPublicApp()
      await showcase.close()

      const res = await lookup(app)

      expect(res.statusCode).toBe(502)
      expect(res.json()).toEqual({ error: 'upstream_unavailable' })
    })
  })

  describe('abuse controls', () => {
    it('accepts a body of exactly 64 KiB', async () => {
      app = await buildPublicApp()

      const res = await lookup(app, {}, jsonBodyOfSize(SHOWCASE_BODY_LIMIT))

      expect(SHOWCASE_BODY_LIMIT).toBe(64 * 1024)
      expect(res.statusCode).toBe(200)
      expect(showcase.received).toHaveLength(1)
    })

    it('refuses a body one byte over 64 KiB with a bare 413, without contacting Consent', async () => {
      app = await buildPublicApp()

      const res = await lookup(app, {}, jsonBodyOfSize(SHOWCASE_BODY_LIMIT + 1))

      expect(res.statusCode).toBe(413)
      expect(res.body).toBe('')
      expect(showcase.received).toHaveLength(0)
    })

    it('answers 415 for a non-JSON media type and a bare 400 for malformed JSON', async () => {
      app = await buildPublicApp()

      const plain = await lookup(app, { 'content-type': 'text/plain' }, 'not json')
      const malformed = await lookup(app, {}, '{"mode":')

      expect(plain.statusCode).toBe(415)
      expect(malformed.statusCode).toBe(400)
      expect(malformed.body).toBe('')
      expect(showcase.received).toHaveLength(0)
    })

    it('refuses a client over its limit with a bare 429 and a Retry-After', async () => {
      app = await buildPublicApp()

      const accepted: number[] = []
      for (let i = 0; i < SHOWCASE_MAX_PER_WINDOW; i += 1) {
        accepted.push((await lookup(app)).statusCode)
      }
      const refused = await lookup(app)

      expect(accepted.every(status => status === 200)).toBe(true)
      expect(refused.statusCode).toBe(429)
      expect(refused.body).toBe('')
      expect(Number(refused.headers['retry-after'])).toBeGreaterThan(0)
      expect(showcase.received).toHaveLength(SHOWCASE_MAX_PER_WINDOW)
    })

    it('counts the showcase limit apart from the feature-flag limit', async () => {
      app = await buildPublicApp()
      for (let i = 0; i < SHOWCASE_MAX_PER_WINDOW; i += 1) {
        await lookup(app)
      }

      const flags = await app.inject({ method: 'GET', url: '/public/features' })

      expect(flags.statusCode).toBe(200)
    })
  })

  describe('configuration', () => {
    it('answers 503 when DUOS_SHOWCASE_API_URL is unset, and never falls back to DUOS_API_URL', async () => {
      delete process.env.DUOS_SHOWCASE_API_URL
      const logLines: string[] = []
      app = await buildPublicApp(logLines)

      const res = await lookup(app)

      expect(res.statusCode).toBe(503)
      expect(res.json()).toEqual({ error: 'upstream_not_configured' })
      expect(api.received).toHaveLength(0)
      expect(logLines.some(line => line.includes('DUOS_SHOWCASE_API_URL is not set'))).toBe(true)
    })

    it('refuses to register when DUOS_SHOWCASE_API_URL is not a bare origin', async () => {
      process.env.DUOS_SHOWCASE_API_URL = 'https://consent.dsde-dev.broadinstitute.org/showcase'
      const shell = Fastify({ logger: false })
      await shell.register(fastifyRateLimit, { global: false })
      shell.register(publicProxy)

      await expect(shell.ready()).rejects.toThrow('DUOS_SHOWCASE_API_URL')
      await shell.close()
    })
  })

  it('logs public.completed with the showcase route label', async () => {
    const logLines: string[] = []
    app = await buildPublicApp(logLines)

    await lookup(app)

    const events = logLines
      .map(line => JSON.parse(line) as { event?: string, route?: string, status?: number })
      .filter(entry => entry.event === 'public.completed')
    expect(events.map(({ route, status }) => ({ route, status }))).toEqual([{ route: 'showcase_datasets', status: 200 }])
  })
})
