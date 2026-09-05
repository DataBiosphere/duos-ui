import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyRateLimit from '@fastify/rate-limit'
import {
  FEATURES_MAX_PER_WINDOW,
  METRICS_BODY_LIMIT,
  PUBLIC_FEATURES_PREFIX,
  PUBLIC_METRICS_EVENT_PATH,
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

const FEATURE_KEY = 'NHGRI_RESTRICTED_DAC'

describe('publicProxy', () => {
  let api: Upstream
  let bard: Upstream
  let app: FastifyInstance | undefined

  beforeEach(async () => {
    api = await startUpstream()
    bard = await startUpstream()
    process.env.DUOS_API_URL = api.origin
    process.env.DUOS_BARD_URL = bard.origin
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await api.close()
    await bard.close()
    delete process.env.DUOS_API_URL
    delete process.env.DUOS_BARD_URL
  })

  async function buildPublicApp(): Promise<FastifyInstance> {
    const instance = Fastify({ logger: false, trustProxy: TRUST_PROXY })
    await instance.register(fastifyRateLimit, { global: false })
    await instance.register(publicProxy)
    return instance
  }

  async function buildPublicAppWithSession(accessToken: string): Promise<FastifyInstance> {
    const instance = await buildAppShell()
    seedSession(instance, { accessToken, tokenExpiry: Math.floor(Date.now() / 1000) + 3600 })
    await instance.register(publicProxy)
    return instance
  }

  describe('routing', () => {
    it('reaches /feature on the DUOS API', async () => {
      app = await buildPublicApp()

      const res = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(res.statusCode).toBe(200)
      expect(api.last().url).toBe('/feature')
      expect(bard.received).toHaveLength(0)
    })

    it('reaches /feature/:key for a single flag', async () => {
      app = await buildPublicApp()

      const res = await app.inject({ method: 'GET', url: `${PUBLIC_FEATURES_PREFIX}/${FEATURE_KEY}` })

      expect(res.statusCode).toBe(200)
      expect(api.last().url).toBe(`/feature/${FEATURE_KEY}`)
    })

    it('forwards the query string byte-for-byte rather than re-encoding it', async () => {
      app = await buildPublicApp()

      await app.inject({ method: 'GET', url: `${PUBLIC_FEATURES_PREFIX}/${FEATURE_KEY}?q=a%20b&r=c` })

      expect(api.last().url).toBe(`/feature/${FEATURE_KEY}?q=a%20b&r=c`)
    })

    it('reaches /api/event on Bard, the one path an anonymous caller may take', async () => {
      app = await buildPublicApp()

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ event: 'duos:dataset_search', properties: { appId: 'DUOS' } }),
      })

      expect(res.statusCode).toBe(200)
      expect(bard.last().url).toBe('/api/event')
      expect(JSON.parse(bard.last().body.toString())).toEqual({
        event: 'duos:dataset_search',
        properties: { appId: 'DUOS' },
      })
      expect(api.received).toHaveLength(0)
    })

    it('exposes no other Bard path, so identified metrics cannot be posted anonymously through it', async () => {
      app = await buildPublicApp()

      const res = await app.inject({ method: 'POST', url: '/public/metrics/identify' })

      expect(res.statusCode).toBe(404)
      expect(bard.received).toHaveLength(0)
    })
  })

  describe('the request leg omits the session token structurally', () => {
    it('sends no Authorization header upstream even when the request carries a session holding an access token', async () => {
      app = await buildPublicAppWithSession('a-live-session-access-token')
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX, headers: { cookie } })

      expect(res.statusCode).toBe(200)
      expect(api.last().headers.authorization).toBeUndefined()
    })

    it('sends no Authorization header on the metrics POST either, session or no session', async () => {
      app = await buildPublicAppWithSession('a-live-session-access-token')
      const { cookie } = await csrfCredentials(app)

      await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { cookie, 'content-type': 'application/json' },
        payload: '{"event":"duos:page_view"}',
      })

      expect(bard.last().headers.authorization).toBeUndefined()
    })

    it('drops a client-supplied Authorization header instead of forwarding it', async () => {
      app = await buildPublicApp()

      await app.inject({
        method: 'GET',
        url: PUBLIC_FEATURES_PREFIX,
        headers: { authorization: 'Bearer browser-held-token' },
      })

      expect(api.last().headers.authorization).toBeUndefined()
    })

    it('strips the session cookie and the CSRF token, and injects x-app-id', async () => {
      app = await buildPublicAppWithSession('a-live-session-access-token')
      const { cookie, token } = await csrfCredentials(app)

      await app.inject({
        method: 'GET',
        url: `${PUBLIC_FEATURES_PREFIX}/${FEATURE_KEY}`,
        headers: { cookie, 'x-csrf-token': token },
      })

      const forwarded = api.last().headers
      expect(forwarded.cookie).toBeUndefined()
      expect(forwarded['x-csrf-token']).toBeUndefined()
      expect(forwarded['x-app-id']).toBe('DUOS')
    })

    it('appends this pod to the forwarded-for chain rather than replacing it', async () => {
      app = await buildPublicApp()

      await app.inject({
        method: 'GET',
        url: PUBLIC_FEATURES_PREFIX,
        headers: { 'x-forwarded-for': '203.0.113.7' },
      })

      expect(api.last().headers['x-forwarded-for']).toBe('203.0.113.7, 127.0.0.1')
    })
  })

  describe('the response leg', () => {
    it('does not let an upstream set a cookie on this origin', async () => {
      app = await buildPublicApp()
      api.respondWith((_req, res) => {
        res.writeHead(200, {
          'set-cookie': 'sessionId=upstream-forged; Path=/',
          'www-authenticate': 'Bearer realm="consent"',
          'content-type': 'application/json',
        })
        res.end('{}')
      })

      const res = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(res.headers['set-cookie']).toBeUndefined()
      expect(res.headers['www-authenticate']).toBeUndefined()
      expect(res.json()).toEqual({})
    })

    it('hardens both endpoints against executing on the SPA origin', async () => {
      app = await buildPublicApp()

      const flags = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })
      const event = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'application/json' },
        payload: '{"event":"duos:page_view"}',
      })

      for (const res of [flags, event]) {
        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.headers['content-security-policy']).toBe('sandbox')
      }
    })
  })

  describe('feature-flag response validation', () => {
    it('passes a JSON body through', async () => {
      app = await buildPublicApp()
      api.respondWith((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end('{"NHGRI_RESTRICTED_DAC":{"value":"7"}}')
      })

      const res = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ NHGRI_RESTRICTED_DAC: { value: '7' } })
    })

    it('answers 502 rather than streaming a non-JSON upstream body onto this origin', async () => {
      app = await buildPublicApp()
      api.respondWith((_req, res) => {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<script>alert(1)</script>')
      })

      const res = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(res.statusCode).toBe(502)
      expect(res.json()).toEqual({ error: 'upstream_not_json' })
      expect(res.body).not.toContain('<script>')
    })

    it('answers 502 for an upstream response with no content type at all', async () => {
      app = await buildPublicApp()
      api.respondWith((_req, res) => {
        res.writeHead(200)
        res.end('not json')
      })

      const res = await app.inject({ method: 'GET', url: `${PUBLIC_FEATURES_PREFIX}/${FEATURE_KEY}` })

      expect(res.statusCode).toBe(502)
    })

    it('passes a bodiless response through, so a missing flag stays a 404 rather than becoming an outage', async () => {
      app = await buildPublicApp()
      api.respondWith((_req, res) => {
        res.writeHead(404, { 'content-length': '0' })
        res.end()
      })

      const res = await app.inject({ method: 'GET', url: `${PUBLIC_FEATURES_PREFIX}/missing` })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('abuse controls on an endpoint anyone on the internet can reach', () => {
    it('refuses a metrics body over the limit with 413, without contacting Bard', async () => {
      app = await buildPublicApp()
      const oversized = JSON.stringify({ event: 'duos:page_view', properties: { pad: 'x'.repeat(METRICS_BODY_LIMIT) } })

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'application/json' },
        payload: oversized,
      })

      expect(res.statusCode).toBe(413)
      expect(bard.received).toHaveLength(0)
    })

    it('accepts a body inside the limit, so the cap is not merely rejecting everything', async () => {
      app = await buildPublicApp()
      const payload = JSON.stringify({ event: 'duos:page_view', properties: { pad: 'x'.repeat(1024) } })

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'application/json' },
        payload,
      })

      expect(res.statusCode).toBe(200)
      expect(bard.received).toHaveLength(1)
    })

    it('answers 415 for a media type it has no parser for, before a handler runs', async () => {
      app = await buildPublicApp()

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'text/plain' },
        payload: 'not json',
      })

      expect(res.statusCode).toBe(415)
      expect(bard.received).toHaveLength(0)
    })

    it('refuses a client over the feature-flag limit with 429', async () => {
      app = await buildPublicApp()

      const accepted: number[] = []
      for (let i = 0; i < FEATURES_MAX_PER_WINDOW; i += 1) {
        accepted.push((await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })).statusCode)
      }
      const refused = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(accepted.every(status => status === 200)).toBe(true)
      expect(refused.statusCode).toBe(429)
    })

    it('answers the refusal with a bare status, naming neither the framework nor the retry window', async () => {
      app = await buildPublicApp()
      for (let i = 0; i < FEATURES_MAX_PER_WINDOW; i += 1) {
        await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })
      }

      const refused = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(refused.body).toBe('')
    })

    it('leaks no framework error code when a request is rejected before the handler', async () => {
      app = await buildPublicApp()

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ pad: 'x'.repeat(METRICS_BODY_LIMIT) }),
      })

      expect(res.body).toBe('')
      expect(res.body).not.toContain('FST_ERR')
    })

    it('answers a malformed JSON body with a bare 400', async () => {
      app = await buildPublicApp()

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { 'content-type': 'application/json' },
        payload: '{"event":',
      })

      expect(res.statusCode).toBe(400)
      expect(res.body).toBe('')
      expect(bard.received).toHaveLength(0)
    })
  })

  describe('no CSRF and no Fetch Metadata guard', () => {
    it('accepts the metrics POST with no CSRF token, in an app where CSRF is registered', async () => {
      app = await buildPublicAppWithSession('a-live-session-access-token')
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: PUBLIC_METRICS_EVENT_PATH,
        headers: { cookie, 'content-type': 'application/json' },
        payload: '{"event":"duos:page_view"}',
      })

      expect(res.statusCode).toBe(200)
      expect(bard.received).toHaveLength(1)
    })

    it('serves a cross-site request the Fetch Metadata guard would have rejected on a proxy route', async () => {
      app = await buildPublicApp()

      const res = await app.inject({
        method: 'GET',
        url: PUBLIC_FEATURES_PREFIX,
        headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' },
      })

      expect(res.statusCode).toBe(200)
    })
  })

  describe('upstream transport failures', () => {
    it('reports an unreachable upstream as 502 rather than a bare 500', async () => {
      app = await buildPublicApp()
      await api.close()

      const res = await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })

      expect(res.statusCode).toBe(502)
      expect(res.json()).toEqual({ error: 'upstream_unavailable' })
    })
  })

  describe('registration against a partly configured deployment', () => {
    it('boots with neither upstream configured, because it registers outside both cutover switches', async () => {
      delete process.env.DUOS_API_URL
      delete process.env.DUOS_BARD_URL
      app = await buildPublicApp()

      await expect(app.ready()).resolves.toBeDefined()
      expect((await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })).statusCode).toBe(404)
      expect((await app.inject({ method: 'POST', url: PUBLIC_METRICS_EVENT_PATH })).statusCode).toBe(404)
    })

    it('registers the feature flags when only the DUOS API is configured', async () => {
      delete process.env.DUOS_BARD_URL
      app = await buildPublicApp()

      expect((await app.inject({ method: 'GET', url: PUBLIC_FEATURES_PREFIX })).statusCode).toBe(200)
      expect((await app.inject({ method: 'POST', url: PUBLIC_METRICS_EVENT_PATH })).statusCode).toBe(404)
    })

    it.each([
      ['DUOS_API_URL', 'consent.dsde-dev.broadinstitute.org'],
      ['DUOS_BARD_URL', 'https://terra-bard-dev.appspot.com/api'],
    ])('refuses to register when %s is set but not a bare origin', async (envVar, value) => {
      process.env[envVar] = value
      const shell = Fastify({ logger: false })
      shell.register(publicProxy)

      await expect(shell.ready()).rejects.toThrow(envVar)
      await shell.close()
    })
  })
})
