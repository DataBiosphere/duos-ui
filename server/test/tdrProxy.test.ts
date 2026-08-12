import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type FastifyInstance } from 'fastify'
import { RefreshFailedError } from '../src/auth/refresh.js'
import { CSRF_ERROR_CODE } from '../src/proxy/upstreamProxy.js'
import { TDR_PROXY_PREFIX, tdrProxy, tdrUpstreamPath } from '../src/proxy/tdrProxy.js'
import {
  SESSION_COOKIE,
  type SessionSeed,
  type Upstream,
  buildAppShell,
  csrfCredentials,
  nowSeconds,
  seedSession,
  startUpstream,
  trackSession,
} from './proxyTestHarness.js'

/**
 * The TDR proxy suite.
 *
 * Same division of labor as ecmProxy.test.ts: the shared machinery is
 * exercised across the 100+ cases in apiProxy.test.ts, and this suite pins
 * down the TDR *configuration* — the prefix and upstream env var, no
 * unauthenticated paths, no CSRF exemptions, the upstream-401 pass-through —
 * against the one call the client actually makes: batched, concurrent
 * `GET /api/repository/v1/snapshots?limit=1000&duosDatasetIds=…` requests
 * (TerraDataRepo.listSnapshotsByDatasetIds), whose repeated query params must
 * survive the proxy byte-for-byte.
 */

vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

// The one path the client calls today (TerraDataRepo.ts).
const SNAPSHOTS_PATH = '/api/repository/v1/snapshots'

async function buildTdrApp(seed?: SessionSeed): Promise<FastifyInstance> {
  const app = await buildAppShell()
  if (seed) {
    seedSession(app, seed)
  }
  await app.register(tdrProxy)
  return app
}

describe('tdrProxy', () => {
  let upstream: Upstream
  let app: FastifyInstance | undefined

  beforeEach(async () => {
    upstream = await startUpstream()
    process.env.DUOS_TDR_URL = upstream.origin
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await upstream.close()
    delete process.env.DUOS_TDR_URL
  })

  /** A session comfortably outside the refresh window. */
  const freshSession = (accessToken = 'session-access-token'): SessionSeed => ({
    accessToken,
    tokenExpiry: nowSeconds() + 3600,
  })

  describe('tdrUpstreamPath', () => {
    it.each([
      [`${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}?limit=1000&duosDatasetIds=DUOS-000852`, SNAPSHOTS_PATH],
      [`${TDR_PROXY_PREFIX}/`, '/'],
      [TDR_PROXY_PREFIX, '/'],
    ])('maps %s to %s', (url, expected) => {
      expect(tdrUpstreamPath(url)).toBe(expected)
    })
  })

  describe('routing and the request leg', () => {
    // The client batches 70 ids into one query string as repeated
    // duosDatasetIds params — the enumeration breaks if the proxy re-encodes,
    // collapses, or reorders them, so the assertion is byte-for-byte.
    it('forwards the batched snapshot query verbatim, with the session token injected', async () => {
      app = await buildTdrApp(freshSession('the-session-token'))
      const ids = Array.from({ length: 70 }, (_, i) => `DUOS-${String(i).padStart(6, '0')}`)
      const query = `limit=1000&duosDatasetIds=${ids.join('&duosDatasetIds=')}`

      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}?${query}` })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().url).toBe(`${SNAPSHOTS_PATH}?${query}`)
      expect(upstream.last().headers.authorization).toBe('Bearer the-session-token')
      expect(upstream.last().headers['x-app-id']).toBe('DUOS')
    })

    // listSnapshotsByDatasetIds fires its batches with Promise.all — the
    // proxy's socket pool must serve them all, not just the first.
    it('serves concurrent batched requests', async () => {
      app = await buildTdrApp(freshSession())
      const localApp = app

      const responses = await Promise.all(Array.from({ length: 5 }, (_, i) =>
        localApp.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}?limit=1000&duosDatasetIds=DUOS-${i}` }),
      ))

      expect(responses.map(r => r.statusCode)).toEqual([200, 200, 200, 200, 200])
      expect(upstream.received).toHaveLength(5)
    })

    it('strips the session cookie and the client Authorization header before forwarding', async () => {
      app = await buildTdrApp(freshSession('the-session-token'))

      const { cookie } = await csrfCredentials(app)
      await app.inject({
        method: 'GET',
        url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}?limit=1000`,
        // The legacy client constructed its own bearer header; whatever a
        // client sends must never reach TDR.
        headers: { cookie, authorization: 'Bearer browser-held-token' },
      })

      const forwarded = upstream.last().headers
      expect(forwarded.cookie).toBeUndefined()
      expect(forwarded.authorization).toBe('Bearer the-session-token')
    })
  })

  describe('no unauthenticated paths', () => {
    // The DUOS API proxy allowlists five paths; TDR allowlists none. Pinned
    // against a path the sibling proxy would wave through, so the two configs
    // cannot be conflated.
    it.each(['/status', SNAPSHOTS_PATH, '/'])('%s is unreachable without a session', async (path) => {
      app = await buildTdrApp()

      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${path}` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('CSRF enforcement', () => {
    // The client only GETs TDR today, but the wildcard route proxies every
    // method — an unsafe one must present a token like anywhere else.
    it('rejects a POST without a token before it reaches TDR', async () => {
      app = await buildTdrApp(freshSession())
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}`,
        headers: { cookie },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: CSRF_ERROR_CODE })
      expect(upstream.received).toHaveLength(0)
    })

    // The DUOS API proxy exempts the signed-out Contact Us POSTs; the TDR
    // config's exemption set is empty, and this is what proves it stays that
    // way — the same path that is exempt through /duos-api is enforced here.
    it('has no unsafe-request exemptions: POST /support/request is enforced through this prefix', async () => {
      app = await buildTdrApp(freshSession())

      const res = await app.inject({
        method: 'POST',
        url: `${TDR_PROXY_PREFIX}/support/request`,
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: CSRF_ERROR_CODE })
      expect(upstream.received).toHaveLength(0)
    })

    it('passes a GET without a token', async () => {
      app = await buildTdrApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}` })

      expect(res.statusCode).toBe(200)
      expect(upstream.received).toHaveLength(1)
    })
  })

  describe('the response leg', () => {
    it('hardens every proxied response against executing on the SPA origin', async () => {
      app = await buildTdrApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}?limit=1000` })

      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(res.headers['content-security-policy']).toBe('sandbox')
    })

    it('strips set-cookie and www-authenticate from the upstream response', async () => {
      app = await buildTdrApp(freshSession())
      upstream.respondWith((_req, res) => {
        res.writeHead(200, {
          'set-cookie': 'sessionId=upstream-forged; Path=/',
          'www-authenticate': 'Bearer realm="tdr"',
          'content-type': 'application/json',
        })
        res.end('{"total":0,"items":[]}')
      })

      // The request carries an existing session cookie — a cookieless GET
      // would mint a session, and @fastify/session's own legitimate
      // Set-Cookie would be indistinguishable from a leaked upstream one.
      const { cookie } = await csrfCredentials(app)
      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}`, headers: { cookie } })

      expect(res.headers['set-cookie']).toBeUndefined()
      expect(res.headers['www-authenticate']).toBeUndefined()
      expect(res.json()).toEqual({ total: 0, items: [] })
    })
  })

  describe('an upstream 401 does not end the session', () => {
    // The divergence from the DUOS API proxy, and the reason it exists: TDR
    // authenticates on its own terms (via Sam), so its 401 must surface to the
    // dataset UI as a failed enumeration rather than sign the user out of DUOS.
    it('passes the 401 through with the session and cookie intact', async () => {
      app = await buildTdrApp(freshSession())
      const tracked = trackSession(app)
      upstream.respondWith((_req, res) => {
        res.writeHead(401, { 'content-type': 'application/json', 'www-authenticate': 'Bearer error="invalid_token"' })
        res.end('{"message":"token rejected by TDR"}')
      })

      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}?limit=1000` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ message: 'token rejected by TDR' })
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
      app = await buildTdrApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}` })

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(upstream.last().headers.authorization).toBe('Bearer renewed-token')
    })

    it('returns 401 and clears the cookie when the refresh fails terminally', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      vi.mocked(refreshAccessToken).mockRejectedValue(new RefreshFailedError('refresh_failed'))
      app = await buildTdrApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      const res = await app.inject({ method: 'GET', url: `${TDR_PROXY_PREFIX}${SNAPSHOTS_PATH}` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      expect(res.cookies).toContainEqual(
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      )
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('DUOS_TDR_URL validation', () => {
    // Same guard as DUOS_API_URL, and the error must name THIS variable — a
    // misconfigured TDR origin diagnosed as an API-proxy problem would send
    // whoever reads the crash log to the wrong Helm value.
    it.each([
      ['unset', undefined],
      ['a bare hostname', 'jade.datarepo-dev.broadinstitute.org'],
      ['an origin with a path', 'https://jade.datarepo-dev.broadinstitute.org/api'],
    ])('refuses to register when DUOS_TDR_URL is %s', async (_label, value) => {
      if (value === undefined) {
        delete process.env.DUOS_TDR_URL
      }
      else {
        process.env.DUOS_TDR_URL = value
      }
      const shell = await buildAppShell()
      shell.register(tdrProxy)

      await expect(shell.ready()).rejects.toThrow('DUOS_TDR_URL')
      await shell.close()
    })
  })
})
