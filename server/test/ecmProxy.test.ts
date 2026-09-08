import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type FastifyInstance } from 'fastify'
import { RefreshFailedError } from '../src/auth/refresh.js'
import { CSRF_ERROR_CODE } from '../src/proxy/upstreamProxy.js'
import { ECM_PROXY_PREFIX, ecmProxy, ecmUpstreamPath } from '../src/proxy/ecmProxy.js'
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
 * The ECM proxy suite.
 * What this suite pins down is the ECM *configuration*: the prefix and upstream env var, that nothing under this
 * prefix is reachable without a session, that no unsafe request is exempt from CSRF, and that an upstream 401 passes
 * through without ending the BFF session. Plus one representative case per shared rule, against the two paths
 * AuthenticateNIH.ts actually calls, so the ECM registration as a whole is proven wired to the machinery.
 */

vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

// The two paths the client calls today (AuthenticateNIH.ts, provider 'ras').
const AUTH_URL_PATH = '/api/oauth/v1/ras/authorization-url'
const OAUTHCODE_PATH = '/api/oauth/v1/ras/oauthcode'

async function buildEcmApp(seed?: SessionSeed): Promise<FastifyInstance> {
  const app = await buildAppShell()
  if (seed) {
    seedSession(app, seed)
  }
  await app.register(ecmProxy)
  return app
}

describe('ecmProxy', () => {
  let upstream: Upstream
  let app: FastifyInstance | undefined

  beforeEach(async () => {
    upstream = await startUpstream()
    process.env.DUOS_ECM_URL = upstream.origin
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await upstream.close()
    delete process.env.DUOS_ECM_URL
  })

  /** A session comfortably outside the refresh window. */
  const freshSession = (accessToken = 'session-access-token'): SessionSeed => ({
    accessToken,
    tokenExpiry: nowSeconds() + 3600,
  })

  describe('ecmUpstreamPath', () => {
    it.each([
      [`${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x`, AUTH_URL_PATH],
      [`${ECM_PROXY_PREFIX}${OAUTHCODE_PATH}?state=s&oauthcode=c`, OAUTHCODE_PATH],
      [`${ECM_PROXY_PREFIX}/`, '/'],
      [ECM_PROXY_PREFIX, '/'],
    ])('maps %s to %s', (url, expected) => {
      expect(ecmUpstreamPath(url)).toBe(expected)
    })
  })

  describe('routing and the request leg', () => {
    it('forwards the path with the prefix stripped and the query verbatim, with the session token injected', async () => {
      app = await buildEcmApp(freshSession('the-session-token'))

      const res = await injectWithCsrf(app, {
        method: 'POST',
        url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=https%3A%2F%2Fduos.example.org%2Fnih_callback`,
      })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().url).toBe(`${AUTH_URL_PATH}?redirectUri=https%3A%2F%2Fduos.example.org%2Fnih_callback`)
      expect(upstream.last().headers.authorization).toBe('Bearer the-session-token')
      expect(upstream.last().headers['x-app-id']).toBe('DUOS')
    })

    it('strips the session cookie, the client Authorization header, and the CSRF token before forwarding', async () => {
      app = await buildEcmApp(freshSession('the-session-token'))

      await injectWithCsrf(app, {
        method: 'POST',
        url: `${ECM_PROXY_PREFIX}${OAUTHCODE_PATH}?state=s&oauthcode=c`,
        // The legacy client constructed its own bearer header; whatever a
        // client sends must never reach ECM.
        headers: { authorization: 'Bearer browser-held-token' },
      })

      const forwarded = upstream.last().headers
      expect(forwarded.cookie).toBeUndefined()
      expect(forwarded['x-csrf-token']).toBeUndefined()
      expect(forwarded.authorization).toBe('Bearer the-session-token')
    })

    it('streams a JSON POST body through untouched', async () => {
      app = await buildEcmApp(freshSession())

      await injectWithCsrf(app, {
        method: 'POST',
        url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x`,
        headers: { 'content-type': 'application/json' },
        payload: '{"redirectTo":"/profile"}',
      })

      expect(upstream.last().body.toString()).toBe('{"redirectTo":"/profile"}')
    })
  })

  describe('no unauthenticated paths', () => {
    // The DUOS API proxy allowlists five paths; ECM allowlists none. Pinned
    // against a path the sibling proxy would wave through, so the two configs
    // cannot be conflated.
    it.each(['/status', AUTH_URL_PATH, '/'])('%s is unreachable without a session', async (path) => {
      app = await buildEcmApp()

      const res = await app.inject({ method: 'GET', url: `${ECM_PROXY_PREFIX}${path}` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
      expect(upstream.received).toHaveLength(0)
    })
  })

  // One representative case: the guard is shared machinery (fetchMetadata.test.ts
  // owns the matrix); this pins that THIS prefix is covered by it.
  describe('Fetch Metadata enforcement (story 5-B)', () => {
    it('rejects a same-site cross-origin request without calling ECM', async () => {
      app = await buildEcmApp(freshSession())

      const res = await app.inject({
        method: 'GET',
        url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}`,
        headers: { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'cors' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: 'cross_site_request_blocked' })
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('CSRF enforcement', () => {
    it('rejects a POST without a token before it reaches ECM', async () => {
      app = await buildEcmApp(freshSession())
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x`,
        headers: { cookie },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: CSRF_ERROR_CODE })
      expect(upstream.received).toHaveLength(0)
    })

    // The DUOS API proxy exempts the signed-out Contact Us POSTs; the ECM
    // config's exemption set is empty, and this is what proves it stays that
    // way — the same path that is exempt through /duos-api is enforced here.
    it('has no unsafe-request exemptions: POST /support/request is enforced through this prefix', async () => {
      app = await buildEcmApp(freshSession())

      const res = await app.inject({
        method: 'POST',
        url: `${ECM_PROXY_PREFIX}/support/request`,
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: CSRF_ERROR_CODE })
      expect(upstream.received).toHaveLength(0)
    })

    it('passes a GET without a token', async () => {
      app = await buildEcmApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}` })

      expect(res.statusCode).toBe(200)
      expect(upstream.received).toHaveLength(1)
    })
  })

  describe('the response leg', () => {
    it('hardens every proxied response against executing on the SPA origin', async () => {
      app = await buildEcmApp(freshSession())

      const res = await injectWithCsrf(app, { method: 'POST', url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x` })

      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(res.headers['content-security-policy']).toBe('sandbox')
    })

    it('strips set-cookie and www-authenticate from the upstream response', async () => {
      app = await buildEcmApp(freshSession())
      upstream.respondWith((_req, res) => {
        res.writeHead(200, {
          'set-cookie': 'sessionId=upstream-forged; Path=/',
          'www-authenticate': 'Bearer realm="ecm"',
          'content-type': 'text/plain',
        })
        res.end('https://ras.example.org/authorize')
      })

      const res = await injectWithCsrf(app, { method: 'POST', url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x` })

      expect(res.headers['set-cookie']).toBeUndefined()
      expect(res.headers['www-authenticate']).toBeUndefined()
      expect(res.body).toBe('https://ras.example.org/authorize')
    })
  })

  describe('an upstream 401 does not end the session', () => {
    it('passes the 401 through with the session and cookie intact', async () => {
      app = await buildEcmApp(freshSession())
      const tracked = trackSession(app)
      upstream.respondWith((_req, res) => {
        res.writeHead(401, { 'content-type': 'application/json', 'www-authenticate': 'Bearer error="invalid_token"' })
        res.end('{"message":"token rejected by ECM"}')
      })

      const res = await injectWithCsrf(app, { method: 'POST', url: `${ECM_PROXY_PREFIX}${OAUTHCODE_PATH}?state=s&oauthcode=c` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ message: 'token rejected by ECM' })
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
      app = await buildEcmApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      await injectWithCsrf(app, { method: 'POST', url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x` })

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(upstream.last().headers.authorization).toBe('Bearer renewed-token')
    })

    it('returns 401 and clears the cookie when the refresh fails terminally', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      vi.mocked(refreshAccessToken).mockRejectedValue(new RefreshFailedError('refresh_failed'))
      app = await buildEcmApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      const res = await injectWithCsrf(app, { method: 'POST', url: `${ECM_PROXY_PREFIX}${AUTH_URL_PATH}?redirectUri=x` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      expect(res.cookies).toContainEqual(
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      )
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('DUOS_ECM_URL validation', () => {
    it.each([
      ['unset', undefined],
      ['a bare hostname', 'externalcreds.dsde-dev.broadinstitute.org'],
      ['an origin with a path', 'https://externalcreds.dsde-dev.broadinstitute.org/api'],
    ])('refuses to register when DUOS_ECM_URL is %s', async (_label, value) => {
      if (value === undefined) {
        delete process.env.DUOS_ECM_URL
      }
      else {
        process.env.DUOS_ECM_URL = value
      }
      const shell = await buildAppShell()
      shell.register(ecmProxy)

      await expect(shell.ready()).rejects.toThrow('DUOS_ECM_URL')
      await shell.close()
    })
  })
})
