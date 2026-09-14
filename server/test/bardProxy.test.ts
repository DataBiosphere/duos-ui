import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type FastifyInstance } from 'fastify'
import { RefreshFailedError } from '../src/auth/refresh.js'
import { CSRF_ERROR_CODE } from '../src/proxy/upstreamProxy.js'
import { BARD_PROXY_PREFIX, bardProxy, bardUpstreamPath } from '../src/proxy/bardProxy.js'
import {
  SESSION_COOKIE,
  type SessionSeed,
  type Upstream,
  buildAppShell,
  csrfCredentials,
  injectWithCsrf,
  nowSeconds,
  seedSession,
  startUpstream,
  trackSession,
} from './proxyTestHarness.js'

/**
 * The Bard proxy suite.
 *
 * Same division of labor as ecmProxy.test.ts: the shared machinery is
 * exercised across the 100+ cases in apiProxy.test.ts, and this suite pins
 * down the Bard *configuration* — the prefix and upstream env var, no
 * unauthenticated paths, no CSRF exemptions, the upstream-401 pass-through —
 * against the three POSTs Metrics.ts actually makes. The sessionless-POST
 * rejection is load-bearing here: anonymous events go direct to Bard, never
 * through this prefix, and the 401 is what keeps that split honest.
 */

vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

// The three paths the client calls today (Metrics.ts).
const EVENT_PATH = '/api/event'
const IDENTIFY_PATH = '/api/identify'
const SYNC_PROFILE_PATH = '/api/syncProfile'

async function buildBardApp(seed?: SessionSeed): Promise<FastifyInstance> {
  const app = await buildAppShell()
  if (seed) {
    seedSession(app, seed)
  }
  await app.register(bardProxy)
  return app
}

describe('bardProxy', () => {
  let upstream: Upstream
  let app: FastifyInstance | undefined

  beforeEach(async () => {
    upstream = await startUpstream()
    process.env.DUOS_BARD_URL = upstream.origin
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await upstream.close()
    delete process.env.DUOS_BARD_URL
  })

  /** A session comfortably outside the refresh window. */
  const freshSession = (accessToken = 'session-access-token'): SessionSeed => ({
    accessToken,
    tokenExpiry: nowSeconds() + 3600,
  })

  describe('bardUpstreamPath', () => {
    it.each([
      [`${BARD_PROXY_PREFIX}${EVENT_PATH}`, EVENT_PATH],
      [`${BARD_PROXY_PREFIX}${IDENTIFY_PATH}`, IDENTIFY_PATH],
      [`${BARD_PROXY_PREFIX}${SYNC_PROFILE_PATH}`, SYNC_PROFILE_PATH],
      [`${BARD_PROXY_PREFIX}/`, '/'],
      [BARD_PROXY_PREFIX, '/'],
    ])('maps %s to %s', (url, expected) => {
      expect(bardUpstreamPath(url)).toBe(expected)
    })
  })

  describe('routing and the request leg', () => {
    it('forwards the path with the prefix stripped, with the session token injected', async () => {
      app = await buildBardApp(freshSession('the-session-token'))

      const res = await injectWithCsrf(app, {
        method: 'POST',
        url: `${BARD_PROXY_PREFIX}${SYNC_PROFILE_PATH}`,
      })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().url).toBe(SYNC_PROFILE_PATH)
      expect(upstream.last().headers.authorization).toBe('Bearer the-session-token')
      expect(upstream.last().headers['x-app-id']).toBe('DUOS')
    })

    it('strips the session cookie, the client Authorization header, and the CSRF token before forwarding', async () => {
      app = await buildBardApp(freshSession('the-session-token'))

      await injectWithCsrf(app, {
        method: 'POST',
        url: `${BARD_PROXY_PREFIX}${IDENTIFY_PATH}`,
        // The legacy client constructed its own bearer header; whatever a
        // client sends must never reach Bard.
        headers: { authorization: 'Bearer browser-held-token' },
      })

      const forwarded = upstream.last().headers
      expect(forwarded.cookie).toBeUndefined()
      expect(forwarded['x-csrf-token']).toBeUndefined()
      expect(forwarded.authorization).toBe('Bearer the-session-token')
    })

    // captureEvent's payload nests details, distinct_id and the bard-client
    // default properties — the proxy must not parse or re-serialize any of it.
    it('streams the JSON event body through untouched', async () => {
      app = await buildBardApp(freshSession())
      const body = '{"event":"duos:dataset_search","properties":{"appId":"DUOS","hostname":"duos.example.org"}}'

      await injectWithCsrf(app, {
        method: 'POST',
        url: `${BARD_PROXY_PREFIX}${EVENT_PATH}`,
        headers: { 'content-type': 'application/json' },
        payload: body,
      })

      expect(upstream.last().body.toString()).toBe(body)
    })
  })

  describe('no unauthenticated paths', () => {
    // Anonymous captureEvent goes direct to Bard, not through the proxy — a
    // sessionless request through this prefix is a client bug and must 401
    // loudly, not proxy an anonymous event. /api/event is the path where the
    // distinction bites.
    it.each(['/status', EVENT_PATH, '/'])('%s is unreachable without a session', async (path) => {
      app = await buildBardApp()

      const res = await app.inject({ method: 'GET', url: `${BARD_PROXY_PREFIX}${path}` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
      expect(upstream.received).toHaveLength(0)
    })
  })

  // One representative case: the guard is shared machinery (fetchMetadata.test.ts
  // owns the matrix); this pins that THIS prefix is covered by it.
  describe('Fetch Metadata enforcement (story 5-B)', () => {
    it('rejects a same-site cross-origin request without calling Bard', async () => {
      app = await buildBardApp(freshSession())

      const res = await app.inject({
        method: 'GET',
        url: `${BARD_PROXY_PREFIX}/api/event`,
        headers: { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'cors' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: 'cross_site_request_blocked' })
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('CSRF enforcement', () => {
    it('rejects a POST without a token before it reaches Bard', async () => {
      app = await buildBardApp(freshSession())
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: `${BARD_PROXY_PREFIX}${EVENT_PATH}`,
        headers: { cookie },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: CSRF_ERROR_CODE })
      expect(upstream.received).toHaveLength(0)
    })

    // The DUOS API proxy exempts the signed-out Contact Us POSTs; the Bard
    // config's exemption set is empty, and this is what proves it stays that
    // way — the same path that is exempt through /duos-api is enforced here.
    it('has no unsafe-request exemptions: POST /support/request is enforced through this prefix', async () => {
      app = await buildBardApp(freshSession())

      const res = await app.inject({
        method: 'POST',
        url: `${BARD_PROXY_PREFIX}/support/request`,
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: CSRF_ERROR_CODE })
      expect(upstream.received).toHaveLength(0)
    })

    it('passes a GET without a token', async () => {
      app = await buildBardApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${BARD_PROXY_PREFIX}${EVENT_PATH}` })

      expect(res.statusCode).toBe(200)
      expect(upstream.received).toHaveLength(1)
    })
  })

  describe('the response leg', () => {
    it('hardens every proxied response against executing on the SPA origin', async () => {
      app = await buildBardApp(freshSession())

      const res = await injectWithCsrf(app, { method: 'POST', url: `${BARD_PROXY_PREFIX}${EVENT_PATH}` })

      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(res.headers['content-security-policy']).toBe('sandbox')
    })

    it('strips set-cookie and www-authenticate from the upstream response', async () => {
      app = await buildBardApp(freshSession())
      upstream.respondWith((_req, res) => {
        res.writeHead(200, {
          'set-cookie': 'sessionId=upstream-forged; Path=/',
          'www-authenticate': 'Bearer realm="bard"',
          'content-type': 'application/json',
        })
        res.end('{}')
      })

      const res = await injectWithCsrf(app, { method: 'POST', url: `${BARD_PROXY_PREFIX}${EVENT_PATH}` })

      expect(res.headers['set-cookie']).toBeUndefined()
      expect(res.headers['www-authenticate']).toBeUndefined()
      expect(res.json()).toEqual({})
    })
  })

  describe('an upstream 401 does not end the session', () => {
    it('passes the 401 through with the session and cookie intact', async () => {
      app = await buildBardApp(freshSession())
      const tracked = trackSession(app)
      upstream.respondWith((_req, res) => {
        res.writeHead(401, { 'content-type': 'application/json', 'www-authenticate': 'Bearer error="invalid_token"' })
        res.end('{"message":"token rejected by Bard"}')
      })

      const res = await injectWithCsrf(app, { method: 'POST', url: `${BARD_PROXY_PREFIX}${SYNC_PROFILE_PATH}` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ message: 'token rejected by Bard' })
      // The upstream's bearer challenge still may not reach the browser.
      expect(res.headers['www-authenticate']).toBeUndefined()
      // No Set-Cookie clearing the session — the DUOS session survives.
      expect(res.cookies.find(cookie => cookie.name === SESSION_COOKIE && cookie.value === '')).toBeUndefined()
      expect(await tracked.stored()).not.toBeNull()
    })
  })

  describe('token freshness', () => {
    it('refreshes a near-expiry token before forwarding', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      vi.mocked(refreshAccessToken).mockImplementation(async (request) => {
        request.session.accessToken = 'renewed-token'
        request.session.tokenExpiry = nowSeconds() + 3600
      })
      app = await buildBardApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      await injectWithCsrf(app, { method: 'POST', url: `${BARD_PROXY_PREFIX}${EVENT_PATH}` })

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(upstream.last().headers.authorization).toBe('Bearer renewed-token')
    })

    it('returns 401 and clears the cookie when the refresh fails terminally', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      vi.mocked(refreshAccessToken).mockRejectedValue(new RefreshFailedError('refresh_failed'))
      app = await buildBardApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      const res = await injectWithCsrf(app, { method: 'POST', url: `${BARD_PROXY_PREFIX}${EVENT_PATH}` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      expect(res.cookies).toContainEqual(
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      )
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('DUOS_BARD_URL validation', () => {
    it.each([
      ['unset', undefined],
      ['a bare hostname', 'terra-bard-dev.appspot.com'],
      ['an origin with a path', 'https://terra-bard-dev.appspot.com/api'],
    ])('refuses to register when DUOS_BARD_URL is %s', async (_label, value) => {
      if (value === undefined) {
        delete process.env.DUOS_BARD_URL
      }
      else {
        process.env.DUOS_BARD_URL = value
      }
      const shell = await buildAppShell()
      shell.register(bardProxy)

      await expect(shell.ready()).rejects.toThrow('DUOS_BARD_URL')
      await shell.close()
    })
  })
})
