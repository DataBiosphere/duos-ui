import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { gzipSync } from 'node:zlib'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { RefreshFailedError } from '../src/auth/refresh.js'
import { CSRF_ERROR_CODE, CSRF_EXEMPT_UNSAFE_REQUESTS, PROXY_PREFIX, REFRESH_WINDOW_SECONDS, UNAUTHENTICATED_PATHS, apiProxy, upstreamPath } from '../src/proxy/apiProxy.js'
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

// refreshAccessToken is replaced so the tests never reach B2C; RefreshFailedError
// stays the real class so the proxy's instanceof branch is exercised rather than
// stubbed. Story 3-B's own tests cover what refresh does internally — here it is
// only interesting as a call that succeeds, fails fatally, or fails transiently.
vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

// The stand-ins for the upstream, the session, and the CSRF plumbing live in
// proxyTestHarness.ts, shared with ecmProxy.test.ts since story 3-I.
async function buildProxyApp(seed?: SessionSeed): Promise<FastifyInstance> {
  const app = await buildAppShell()
  if (seed) {
    seedSession(app, seed)
  }
  await app.register(apiProxy)
  return app
}

describe('apiProxy', () => {
  let upstream: Upstream
  let app: FastifyInstance | undefined

  beforeEach(async () => {
    upstream = await startUpstream()
    process.env.DUOS_API_URL = upstream.origin
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await upstream.close()
    delete process.env.DUOS_API_URL
  })

  /** A session comfortably outside the refresh window. */
  const freshSession = (accessToken = 'session-access-token'): SessionSeed => ({
    accessToken,
    tokenExpiry: nowSeconds() + 3600,
  })

  describe('upstreamPath', () => {
    it.each([
      [`${PROXY_PREFIX}/api/dataset/1`, '/api/dataset/1'],
      [`${PROXY_PREFIX}/status`, '/status'],
      [`${PROXY_PREFIX}/api/dar/v2?open=true`, '/api/dar/v2'],
      [`${PROXY_PREFIX}/`, '/'],
      // Defensive only. `/duos-api/*` does not match the bare prefix, so the
      // router 404s `/duos-api` rather than delivering it here (the trailing
      // slash above is the reachable form). Asserted so the exported helper is
      // never the thing that hands `reply.from` an empty source string.
      [PROXY_PREFIX, '/'],
    ])('maps %s to %s', (url, expected) => {
      expect(upstreamPath(url)).toBe(expected)
    })
  })

  describe('routing', () => {
    it('forwards the path with the BFF prefix stripped', async () => {
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().url).toBe('/api/dataset/1')
    })

    // Re-encoding the query would corrupt paths like /ontology/autocomplete,
    // so it is passed through byte-for-byte rather than round-tripped via URL.
    it('forwards the query string verbatim', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/ontology/autocomplete?q=breast%20cancer&n=5` })

      expect(upstream.last().url).toBe('/ontology/autocomplete?q=breast%20cancer&n=5')
    })

    it('forwards the method', async () => {
      app = await buildProxyApp(freshSession())

      await injectWithCsrf(app, { method: 'DELETE', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(upstream.last().method).toBe('DELETE')
    })

    it('returns the upstream status and body to the client', async () => {
      upstream.respondWith((_req, res) => {
        res.writeHead(422, { 'content-type': 'application/json' })
        res.end('{"message":"nope"}')
      })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(422)
      expect(res.body).toBe('{"message":"nope"}')
    })

    // A crafted path cannot walk outside the configured upstream origin. Two
    // separate mechanisms stop it, and this one lands on the first: WHATWG URL
    // parsing resolves the `..` segments (including their `%2e` spellings)
    // before routing, so what reaches the router is `/etc/passwd`, which does
    // not match the proxy prefix. Should a client ever deliver a literal `..`
    // past that, reply-from decodes the source and rejects it with a 400 before
    // building the upstream URL. Either way the upstream is never called.
    it('does not proxy a path traversal attempt', async () => {
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/../../etc/passwd` })

      expect(res.statusCode).toBe(404)
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('the upstream base URL', () => {
    it('fails to register when DUOS_API_URL is unset, naming the variable', async () => {
      delete process.env.DUOS_API_URL
      const unregistered = await buildAppShell()
      unregistered.register(apiProxy)

      await expect(unregistered.ready()).rejects.toThrow('DUOS_API_URL')
      await unregistered.close()
    })

    // reply.from() builds the upstream as new URL(path, base), which discards a
    // base path and then trips its own "source must be a relative path string"
    // guard — so every proxied request would 500. Better to fail at startup.
    it('fails to register when DUOS_API_URL carries a path', async () => {
      process.env.DUOS_API_URL = `${upstream.origin}/consent`
      const unregistered = await buildAppShell()
      unregistered.register(apiProxy)

      await expect(unregistered.ready()).rejects.toThrow(/DUOS_API_URL.*must be a bare origin/s)
      await unregistered.close()
    })

    // A bare hostname is what a Helm value tends to look like, and it is the one
    // malformed value new URL() rejects on its own — with a TypeError naming
    // neither the variable nor the value, so the startup failure says nothing
    // about what to fix. The scheme cases are separated from the path case
    // because 'localhost:8000' parses as protocol 'localhost:' with pathname
    // '8000', so a pathname check alone would report a missing scheme as a path.
    it.each([
      ['a bare hostname', 'duos-api.dsde-dev.broadinstitute.org', /not a valid URL/],
      ['a host:port with no scheme', 'localhost:8000', /scheme is 'localhost:'/],
      ['a non-HTTP scheme', 'ftp://duos-api.example.org', /scheme is 'ftp:'/],
      // new URL(source, base) silently discards a base's query and fragment,
      // so without these two rejections the misconfiguration they signal would
      // be half-honored instead of failing at startup like a path does.
      ['an origin with a query string', 'https://duos-api.example.org?env=dev', /query string or fragment/],
      ['an origin with a fragment', 'https://duos-api.example.org#dev', /query string or fragment/],
    ])('fails to register when DUOS_API_URL is %s, naming the variable', async (_case, value, expected) => {
      process.env.DUOS_API_URL = value
      const unregistered = await buildAppShell()
      unregistered.register(apiProxy)

      const ready = expect(unregistered.ready()).rejects
      await ready.toThrow(/^DUOS_API_URL is/)
      await ready.toThrow(expected)
      await unregistered.close()
    })

    // The one rejection that must NOT echo the value: userinfo may carry a
    // real password, and this error lands in the startup log.
    it('fails to register when DUOS_API_URL carries userinfo, without echoing the credential', async () => {
      process.env.DUOS_API_URL = 'https://svc:hunter2@duos-api.example.org'
      const unregistered = await buildAppShell()
      unregistered.register(apiProxy)

      const err = await unregistered.ready().then(() => null, (e: unknown) => e as Error)
      expect(err).toBeInstanceOf(Error)
      expect(err?.message).toMatch(/DUOS_API_URL contains userinfo/)
      expect(err?.message).toMatch(/must be a bare origin/)
      expect(err?.message).not.toContain('hunter2')
      expect(err?.message).not.toContain('svc')
      await unregistered.close()
    })
  })

  describe('the authentication gate', () => {
    it('returns 401 without calling the upstream for a caller with no session', async () => {
      app = await buildProxyApp()

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
      expect(upstream.received).toHaveLength(0)
    })

    // A session that exists but never completed the OAuth flow — @fastify/session
    // always hands the handler a session object, so "no session" and "no token"
    // are the same check.
    it('returns 401 without calling the upstream when the session holds no access token', async () => {
      app = await buildProxyApp({ tokenExpiry: nowSeconds() + 3600 })

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(401)
      expect(upstream.received).toHaveLength(0)
    })

    it('sends the session access token as a Bearer token', async () => {
      app = await buildProxyApp(freshSession('the-session-token'))

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(upstream.last().headers.authorization).toBe('Bearer the-session-token')
    })
  })

  // The proxy turns every DUOS API write into a cookie-authenticated request,
  // so without this any site could drive them using a signed-in victim's cookie.
  describe('CSRF enforcement', () => {
    const MISSING_SECRET = 'missing_secret'
    const INVALID_TOKEN = 'invalid_token'
    const rejection = (reason: string) => ({ error: CSRF_ERROR_CODE, reason })

    // No cookie, so every request builds a fresh session with no CSRF secret in
    // it. That is the signed-out attacker's request, and it stops at the secret.
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
      'rejects %s from a caller with no session secret, without calling the upstream',
      async (method) => {
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method, url: `${PROXY_PREFIX}/api/dataset/1` })

        expect(res.statusCode).toBe(403)
        expect(res.json()).toEqual(rejection(MISSING_SECRET))
        expect(upstream.received).toHaveLength(0)
      },
    )

    // The case the four above do NOT cover: a real signed-in session that has a
    // secret, on a request that simply carries no token — a client that forgot
    // the header rather than an attacker with no session. One method is enough;
    // that the guard applies to all four is established above.
    it('rejects an unsafe method that has a session secret but sends no token', async () => {
      app = await buildProxyApp(freshSession())
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({ method: 'POST', url: `${PROXY_PREFIX}/api/dataset/1`, headers: { cookie } })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual(rejection(INVALID_TOKEN))
      expect(upstream.received).toHaveLength(0)
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)('accepts %s with a valid token', async (method) => {
      app = await buildProxyApp(freshSession())

      const res = await injectWithCsrf(app, { method, url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(200)
      expect(upstream.received).toHaveLength(1)
    })

    it('rejects a token that does not verify against the session secret', async () => {
      app = await buildProxyApp(freshSession())
      const { cookie } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { cookie, 'x-csrf-token': 'not-the-real-token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual(rejection(INVALID_TOKEN))
      expect(upstream.received).toHaveLength(0)
    })

    // The secret lives in the session, so a token lifted from another browser is
    // worthless without that browser's cookie. Rejected for want of a secret
    // rather than a bad token — the token itself is never reached.
    it('rejects a valid token presented without its session cookie', async () => {
      app = await buildProxyApp(freshSession())
      const { token } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { 'x-csrf-token': token },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual(rejection(MISSING_SECRET))
      expect(upstream.received).toHaveLength(0)
    })

    // `csrfPluginOptions` narrows getToken to one header. The plugin's default
    // would also accept `csrf-token`, `xsrf-token` and `x-xsrf-token`, so with
    // the narrowing gone this request would be accepted — which is what makes
    // this the test that pins it. index.test.ts pins the other half: that
    // buildApp() registers the plugin with those options at all.
    it('does not accept the token under an alternative header spelling', async () => {
      app = await buildProxyApp(freshSession())
      const { token, cookie } = await csrfCredentials(app)

      const res = await app.inject({
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { cookie, 'csrf-token': token },
      })

      // The secret is present and no token was found, so this is the
      // failed-verification path, not the missing-secret one.
      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual(rejection(INVALID_TOKEN))
    })

    it.each(['GET', 'HEAD', 'OPTIONS'] as const)('does not require a token on %s', async (method) => {
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method, url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(200)
    })

    // Both are the signed-out Contact Us form. With no session there is no CSRF
    // secret, so enforcing here would reject them outright — and there is nothing
    // to protect, because they carry no credential for an attacker to borrow.
    it.each(['/support/request', '/support/upload'])('exempts the unauthenticated POST %s', async (path) => {
      app = await buildProxyApp()

      const res = await app.inject({
        method: 'POST',
        url: `${PROXY_PREFIX}${path}`,
        headers: { 'content-type': 'application/json' },
        payload: '{"subject":"help"}',
      })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().url).toBe(path)
    })

    // Pinned as a set for the same reason as UNAUTHENTICATED_PATHS below: adding
    // an entry waives CSRF for a state-changing request, which should have to
    // appear as a deliberate edit to this list in review.
    it('exempts exactly the two signed-out Contact Us POSTs', () => {
      expect([...CSRF_EXEMPT_UNSAFE_REQUESTS].sort()).toEqual([
        'POST /support/request',
        'POST /support/upload',
      ])
    })

    // The regression this pins: keying the exemption on UNAUTHENTICATED_PATHS
    // instead would waive CSRF here too, because that set also holds these
    // read-only endpoints. Harmless today — allowlisted paths get no injected
    // Authorization, so a forged write borrows no authority — but the exemption
    // should not depend on that holding somewhere else in the file.
    it.each(['/status', '/oauth2/configuration', '/tos/text/duos'])(
      'still requires a token on POST %s, though the path is on the unauthenticated allowlist',
      async (path) => {
        app = await buildProxyApp(freshSession())

        const res = await app.inject({
          method: 'POST',
          url: `${PROXY_PREFIX}${path}`,
          headers: { 'content-type': 'application/json' },
          payload: '{}',
        })

        expect(res.statusCode).toBe(403)
        expect(upstream.received).toHaveLength(0)
      },
    )

    // Method is half the key, so the exemption does not generalise from the POST
    // the Contact Us form actually sends to every unsafe method on that path.
    it.each(['PUT', 'PATCH', 'DELETE'] as const)('still requires a token on %s /support/request', async (method) => {
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method, url: `${PROXY_PREFIX}/support/request` })

      expect(res.statusCode).toBe(403)
      expect(upstream.received).toHaveLength(0)
    })

    // Better a startup failure than a proxy quietly accepting writes from any
    // origin because the plugin order changed.
    it('refuses to register when @fastify/csrf-protection is absent', async () => {
      const unguarded = Fastify({ logger: false })
      await unguarded.register(fastifyCookie)
      unguarded.register(apiProxy)

      await expect(unguarded.ready()).rejects.toThrow(/@fastify\/csrf-protection/)
      await unguarded.close()
    })
  })

  describe('the unauthenticated allowlist', () => {
    it('matches the five paths the client calls without an Authorization header today', () => {
      // Pinned as a set rather than spot-checked: adding a path here means
      // deciding that it may be reached with no session, which deserves to
      // show up as a deliberate change to this list in review.
      expect([...UNAUTHENTICATED_PATHS].sort()).toEqual([
        '/oauth2/configuration',
        '/status',
        '/support/request',
        '/support/upload',
        '/tos/text/duos',
      ])
    })

    it.each([...UNAUTHENTICATED_PATHS])('proxies %s with no session', async (path) => {
      app = await buildProxyApp()

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}${path}` })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().url).toBe(path)
    })

    // The signed-out status page and Contact Us form send no token today, so
    // neither may the proxy — cutover must not change what the upstream sees.
    it('injects no Authorization header even when the caller does have a session', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/status` })

      expect(upstream.last().headers.authorization).toBeUndefined()
    })

    // Matched exactly: '/statuses' must not inherit '/status''s exemption.
    it('does not exempt a path that merely starts with an allowlisted one', async () => {
      app = await buildProxyApp()

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/statuses` })

      expect(res.statusCode).toBe(401)
    })

    it('does not refresh the token for an allowlisted path', async () => {
      app = await buildProxyApp({ accessToken: 'about-to-expire', tokenExpiry: nowSeconds() })
      const { refreshAccessToken } = await import('../src/auth/refresh.js')

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/status` })

      expect(refreshAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('proactive token refresh', () => {
    it('does not refresh a token with plenty of life left', async () => {
      app = await buildProxyApp(freshSession())
      const { refreshAccessToken } = await import('../src/auth/refresh.js')

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(refreshAccessToken).not.toHaveBeenCalled()
    })

    it('refreshes a token expiring inside the window, then proxies the request', async () => {
      app = await buildProxyApp({
        accessToken: 'nearly-expired',
        tokenExpiry: nowSeconds() + REFRESH_WINDOW_SECONDS - 5,
      })
      const { refreshAccessToken } = await import('../src/auth/refresh.js')

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(refreshAccessToken).toHaveBeenCalledOnce()
      expect(res.statusCode).toBe(200)
    })

    // A session with no recorded expiry is of unknown age — refreshing is the
    // safe reading, since forwarding it risks a 401 that story 3-E would turn
    // into a sign-out.
    it('refreshes when the session has no recorded expiry', async () => {
      app = await buildProxyApp({ accessToken: 'expiry-unknown' })
      const { refreshAccessToken } = await import('../src/auth/refresh.js')

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(refreshAccessToken).toHaveBeenCalledOnce()
    })

    it('sends the token the refresh installed, not the stale one', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      // The real refreshAccessToken mutates request.session in place; mirroring
      // that here proves the handler reads the token after the refresh rather
      // than capturing it beforehand.
      vi.mocked(refreshAccessToken).mockImplementation(async (request) => {
        request.session.accessToken = 'renewed-token'
        request.session.tokenExpiry = nowSeconds() + 3600
      })
      app = await buildProxyApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(upstream.last().headers.authorization).toBe('Bearer renewed-token')
    })

    it('returns 401 and clears the cookie when the refresh token is dead', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      vi.mocked(refreshAccessToken).mockRejectedValue(new RefreshFailedError('refresh_failed'))
      app = await buildProxyApp({ accessToken: 'stale-token', tokenExpiry: nowSeconds() })

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      // Otherwise the browser keeps presenting a sid whose row is already gone.
      expect(res.cookies).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      ]))
      expect(upstream.received).toHaveLength(0)
    })

    // 401 here would sign out every user the moment B2C hiccuped or a client
    // secret was rotated wrong. The session is untouched, so 502 it is.
    it('returns 502, not 401, when the refresh fails transiently', async () => {
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      vi.mocked(refreshAccessToken).mockRejectedValue(new TypeError('fetch failed'))
      app = await buildProxyApp({ accessToken: 'still-good-token', tokenExpiry: nowSeconds() })

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(502)
      expect(res.json()).toEqual({ error: 'upstream_unavailable' })
      // The distinction that matters: the session survives, so unlike the fatal
      // path above nothing clears the cookie out from under the browser.
      expect(res.cookies).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      ]))
      expect(upstream.received).toHaveLength(0)
    })
  })

  describe('request headers', () => {
    it('never forwards the session cookie', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { cookie: 'sessionId=s%3Aabc.def; other=1' },
      })

      expect(upstream.last().headers.cookie).toBeUndefined()
    })

    it('replaces a client-supplied Authorization header rather than trusting it', async () => {
      app = await buildProxyApp(freshSession('the-session-token'))

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { authorization: 'Bearer attacker-supplied' },
      })

      expect(upstream.last().headers.authorization).toBe('Bearer the-session-token')
    })

    it('drops a client-supplied Authorization header on an allowlisted path', async () => {
      app = await buildProxyApp()

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/status`,
        headers: { authorization: 'Bearer attacker-supplied' },
      })

      expect(upstream.last().headers.authorization).toBeUndefined()
    })

    it('does not forward the BFF CSRF token', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { 'x-csrf-token': 'a-bff-only-token' },
      })

      expect(upstream.last().headers['x-csrf-token']).toBeUndefined()
    })

    it('injects X-App-ID, which the upstream expects on every call', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(upstream.last().headers['x-app-id']).toBe('DUOS')
    })

    it('forwards ordinary client headers untouched', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { 'accept': 'application/json', 'accept-language': 'en-GB' },
      })

      expect(upstream.last().headers.accept).toBe('application/json')
      expect(upstream.last().headers['accept-language']).toBe('en-GB')
    })

    it('sets Host to the upstream, not the BFF', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { host: 'duos.dsde-dev.broadinstitute.org' },
      })

      expect(upstream.last().headers.host).toBe(new URL(upstream.origin).host)
    })

    // The BFF is a genuine hop, so it appends rather than replacing — the
    // original client must stay first in the chain for upstream audit logs.
    it('appends this hop to the inbound X-Forwarded-For chain', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({
        method: 'GET',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { 'x-forwarded-for': '203.0.113.9' },
      })

      const chain = String(upstream.last().headers['x-forwarded-for']).split(', ')
      expect(chain[0]).toBe('203.0.113.9')
      expect(chain).toHaveLength(2)
    })

    it('sends an X-Forwarded-For even when the request arrives without one', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(upstream.last().headers['x-forwarded-for']).toBeTruthy()
    })
  })

  // Every case here fails if the content-type parsers are not cleared in the
  // proxy's scope: Fastify would 415 the multipart and binary uploads before
  // the handler ran, hand JSON over as an already-parsed object (which
  // reply.from would send as "[object Object]"), and cap bodies at bodyLimit.
  describe('request bodies', () => {
    it('streams a JSON body through byte-for-byte instead of re-serialising it', async () => {
      app = await buildProxyApp(freshSession())
      // Key order and spacing survive only if the body was never parsed.
      const payload = '{"b":1,"a":  2}'

      await injectWithCsrf(app, {
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/search`,
        headers: { 'content-type': 'application/json' },
        payload,
      })

      expect(upstream.last().body.toString()).toBe(payload)
      expect(upstream.last().headers['content-type']).toBe('application/json')
    })

    it('proxies a multipart/form-data upload', async () => {
      app = await buildProxyApp(freshSession())
      const body = '--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.txt"\r\n\r\nhello\r\n--boundary--\r\n'

      const res = await injectWithCsrf(app, {
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/v3`,
        headers: { 'content-type': 'multipart/form-data; boundary=boundary' },
        payload: body,
      })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().body.toString()).toBe(body)
      expect(upstream.last().headers['content-type']).toBe('multipart/form-data; boundary=boundary')
    })

    it('proxies an application/binary upload', async () => {
      app = await buildProxyApp(freshSession())
      const body = Buffer.from([0x00, 0x01, 0xFF, 0xFE])

      const res = await app.inject({
        method: 'POST',
        url: `${PROXY_PREFIX}/support/upload`,
        headers: { 'content-type': 'application/binary' },
        payload: body,
      })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().body.equals(body)).toBe(true)
    })

    // Fastify's default bodyLimit is 1 MB. Because the payload is never read
    // into memory it is never measured against it — which is what lets DUOS
    // upload real dataset files through the proxy.
    it('proxies a body larger than the default bodyLimit', async () => {
      app = await buildProxyApp(freshSession())
      const body = Buffer.alloc(2 * 1024 * 1024, 'a')

      const res = await injectWithCsrf(app, {
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/v3`,
        headers: { 'content-type': 'application/octet-stream' },
        payload: body,
      })

      expect(res.statusCode).toBe(200)
      expect(upstream.last().body).toHaveLength(body.length)
    })

    it('sends no body for a GET', async () => {
      app = await buildProxyApp(freshSession())

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(upstream.last().body).toHaveLength(0)
    })
  })

  describe('response handling', () => {
    // undici does not transparently decompress, so a gzip response reaches the
    // browser with its encoding and length intact. The rejected hand-rolled
    // fetch proxy would have decompressed the body while copying
    // content-encoding through, mislabelling it.
    it('passes a gzip-encoded response through undisturbed', async () => {
      const compressed = gzipSync(Buffer.from('{"large":"document"}'))
      upstream.respondWith((_req, res) => {
        res.writeHead(200, {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
          'content-length': String(compressed.length),
        })
        res.end(compressed)
      })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.headers['content-encoding']).toBe('gzip')
      expect(res.rawPayload.equals(compressed)).toBe(true)
    })

    it('forwards upstream response headers', async () => {
      upstream.respondWith((_req, res) => {
        res.writeHead(200, {
          'content-type': 'text/plain',
          'content-disposition': 'attachment; filename="report.tsv"',
        })
        res.end('col\tvalue')
      })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dar/1/document` })

      expect(res.headers['content-disposition']).toBe('attachment; filename="report.tsv"')
      expect(res.body).toBe('col\tvalue')
    })

    // The return leg of the trust boundary. A proxied response is served from
    // the BFF's own origin, so an upstream Set-Cookie would be applied to that
    // origin — overwriting `sessionId` with a value the DUOS API chose, which
    // hands the user a different session or a broken one. Stripping it is what
    // makes the request leg's refusal to forward the cookie worth anything.
    it('does not forward an upstream set-cookie, even one naming the session cookie', async () => {
      upstream.respondWith((_req, res) => {
        res.writeHead(200, {
          'content-type': 'application/json',
          'set-cookie': ['sessionId=upstream-chosen-value; Path=/; HttpOnly', 'tracking=1'],
        })
        res.end('{"ok":true}')
      })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(200)
      // Asserted against the upstream's values rather than as "no set-cookie at
      // all": @fastify/session sets its own `sessionId` on the way out, so an
      // absence check would pass or fail on the BFF's own cookie. What matters is
      // that neither upstream cookie survives — including the one that shares the
      // session cookie's name, which is the whole point of the test.
      const forwarded = res.cookies.map(cookie => cookie.value)
      expect(forwarded).not.toContain('upstream-chosen-value')
      expect(res.cookies.map(cookie => cookie.name)).not.toContain('tracking')
      // The body still arrives — the header is dropped, not the response.
      expect(res.json()).toEqual({ ok: true })
    })

    // Same reasoning: scoped to the BFF origin, so an upstream response could
    // clear the session cookie and the user's local state along with it.
    it('does not forward an upstream clear-site-data', async () => {
      upstream.respondWith((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json', 'clear-site-data': '"cookies", "storage"' })
        res.end('{"ok":true}')
      })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.headers['clear-site-data']).toBeUndefined()
      expect(res.json()).toEqual({ ok: true })
    })

    describe('connection-specific headers', () => {
      it('never forwards an upstream proxy-authenticate challenge', async () => {
        upstream.respondWith((_req, res) => {
          res.writeHead(407, {
            'content-type': 'application/json',
            'proxy-authenticate': 'Basic realm="upstream-proxy"',
          })
          res.end('{"message":"Proxy Authentication Required"}')
        })
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

        expect(res.headers['proxy-authenticate']).toBeUndefined()
        expect(res.statusCode).toBe(407)
        expect(res.json()).toEqual({ message: 'Proxy Authentication Required' })
      })

      it.each(['keep-alive', 'proxy-authorization', 'te', 'trailer', 'upgrade'])(
        'does not forward an upstream %s',
        async (header) => {
          upstream.respondWith((_req, res) => {
            res.writeHead(200, { 'content-type': 'application/json', [header]: 'upstream-hop-value' })
            res.end('{"ok":true}')
          })
          app = await buildProxyApp(freshSession())

          const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

          expect(res.headers[header]).toBeUndefined()
          expect(res.json()).toEqual({ ok: true })
        },
      )

      it('does not forward the keep-alive an upstream emits without being asked', async () => {
        upstream.respondWith((_req, res) => {
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end('{"ok":true}')
        })
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

        expect(res.headers['keep-alive']).toBeUndefined()
      })

      it('gives the browser the transport hop\'s own framing, not the upstream\'s', async () => {
        upstream.respondWith((_req, res) => {
          res.writeHead(200, { 'content-type': 'application/json', 'connection': 'keep-alive' })
          res.write('{"streamed":')
          res.end('true}')
        })
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

        expect(res.headers.connection).not.toBe('keep-alive')
        expect(res.headers['transfer-encoding']).toBe('chunked')
        expect(res.json()).toEqual({ streamed: true })
      })

      it('leaves the origin-state and hardening headers the BFF sets in place', async () => {
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.cookies.map(cookie => cookie.name)).toContain(SESSION_COOKIE)
      })
    })

    describe('response hardening', () => {
      it('neuters an uploaded document served back as text/html', async () => {
        upstream.respondWith((_req, res) => {
          res.writeHead(200, {
            'content-type': 'text/html',
            'content-security-policy': 'default-src \'self\' \'unsafe-inline\'',
            'x-content-type-options': 'sniff-away',
          })
          res.end('<script>fetch("/duos-api/api/user/me")</script>')
        })
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/daa/1/file` })

        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.headers['content-security-policy']).toBe('sandbox')
      })

      it('leaves a blob download byte-for-byte intact', async () => {
        const document = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x00, 0xff, 0xfe, 0x0a])
        upstream.respondWith((_req, res) => {
          res.writeHead(200, {
            'content-type': 'application/pdf',
            'content-length': String(document.length),
            'content-disposition': 'attachment; filename="daa.pdf"',
          })
          res.end(document)
        })
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/daa/1/file` })

        expect(res.rawPayload.equals(document)).toBe(true)
        expect(res.headers['content-disposition']).toBe('attachment; filename="daa.pdf"')
        expect(res.headers['x-content-type-options']).toBe('nosniff')
      })

      it('hardens a reply the proxy writes itself, not only a proxied one', async () => {
        upstream.respondWith((_req, res) => {
          res.writeHead(401, {
            'content-type': 'text/plain',
            'content-security-policy': 'default-src \'self\'',
            'x-content-type-options': 'nosniff',
          })
          res.end('Unauthorized')
        })
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

        expect(res.statusCode).toBe(401)
        expect(res.json()).toEqual({ error: 'session_expired' })
        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.headers['content-security-policy']).toBe('sandbox')
      })

      it('does not leak the headers onto routes outside the proxy scope', async () => {
        app = await buildProxyApp(freshSession())

        const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' })

        expect(res.statusCode).toBe(200)
        expect(res.headers['content-security-policy']).toBeUndefined()
        expect(res.headers['x-content-type-options']).toBeUndefined()
      })
    })

    // reply-from leaves a refused connection at 500, which index.ts's error
    // handler would render as its generic "An unexpected error occurred" —
    // reading as a BFF bug rather than an upstream outage.
    it('returns 502, not 500, when the connection to the upstream is refused', async () => {
      app = await buildProxyApp(freshSession())
      await upstream.close()

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(502)
      expect(res.json()).toEqual({ error: 'upstream_unavailable' })
    })

    // 503 and 504 say more than 502 does, so the mapping above leaves them be.
    // `.invalid` is reserved by RFC 2606 and never resolves, so this is an
    // ENOTFOUND rather than a real DNS lookup.
    it('preserves a gateway-class status the proxy library already assigned', async () => {
      process.env.DUOS_API_URL = 'http://duos-api.invalid'
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(503)
    })
  })

  describe('an upstream 401', () => {
    const rejectingUpstream = (headers: Record<string, string> = {}): void => {
      upstream.respondWith((_req, res) => {
        res.writeHead(401, { 'content-type': 'application/json', ...headers })
        res.end('{"message":"Unauthorized"}')
      })
    }

    it('signs the user out — its own 401, session destroyed, cookie cleared', async () => {
      rejectingUpstream()
      app = await buildProxyApp(freshSession())
      const session = trackSession(app)

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      expect(await session.stored()).toBeNull()
      expect(res.cookies).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      ]))
    })

    it('leaves the session alone when the upstream is happy', async () => {
      app = await buildProxyApp(freshSession())
      const session = trackSession(app)

      await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(await session.stored()).not.toBeNull()
    })

    it('ends the session on a rejected write as well as a read', async () => {
      rejectingUpstream()
      app = await buildProxyApp(freshSession())
      const session = trackSession(app)

      const res = await injectWithCsrf(app, {
        method: 'POST',
        url: `${PROXY_PREFIX}/api/dataset/1`,
        headers: { 'content-type': 'application/json' },
        payload: '{"name":"a dataset"}',
      })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      expect(await session.stored()).toBeNull()
    })

    it('does not leave the upstream response headers describing the reply that replaces it', async () => {
      const compressed = gzipSync(Buffer.from('token rejected'))
      upstream.respondWith((_req, res) => {
        res.writeHead(401, {
          'content-type': 'text/plain',
          'content-encoding': 'gzip',
          'content-length': String(compressed.length),
          'etag': '"upstream-401"',
        })
        res.end(compressed)
      })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'session_expired' })
      expect(res.headers['content-type']).toMatch(/^application\/json/)
      expect(res.headers['content-encoding']).toBeUndefined()
      expect(res.headers.etag).toBeUndefined()
      expect(res.headers['content-length']).toBe(String(res.rawPayload.length))
    })

    it('passes through untouched on an allowlisted path, session intact', async () => {
      rejectingUpstream()
      app = await buildProxyApp(freshSession())
      const session = trackSession(app)

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/status` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ message: 'Unauthorized' })
      expect(await session.stored()).not.toBeNull()
      expect(res.cookies).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ name: SESSION_COOKIE, value: '' }),
      ]))
    })

    it('never forwards an upstream WWW-Authenticate challenge', async () => {
      rejectingUpstream({ 'www-authenticate': 'Basic realm="DUOS API"' })
      app = await buildProxyApp(freshSession())

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/status` })

      expect(res.statusCode).toBe(401)
      expect(res.headers['www-authenticate']).toBeUndefined()
    })
  })

  describe('the error shape', () => {
    async function buildAppWithRootErrorHandler(): Promise<FastifyInstance> {
      const app = await buildAppShell()
      await app.register(async (scope) => {
        await apiProxy(scope)
        scope.get(`${PROXY_PREFIX}-boom`, async () => {
          throw new Error('a stack trace and an internal path')
        })
      })
      app.setErrorHandler((_err, _request, reply) =>
        reply.status(500).send({ error: 'the root handler answered' }))
      app.get('/boom', async () => {
        throw new Error('a stack trace and an internal path')
      })
      return app
    }

    it('sanitises an unexpected proxy-scope error instead of returning its message', async () => {
      app = await buildAppWithRootErrorHandler()

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}-boom` })

      expect(res.statusCode).toBe(500)
      expect(res.json()).toEqual({ error: 'An unexpected error occurred.' })
      expect(res.payload).not.toContain('a stack trace and an internal path')
    })

    it('leaves errors outside the proxy scope to the root handler', async () => {
      app = await buildAppWithRootErrorHandler()

      const res = await app.inject({ method: 'GET', url: '/boom' })

      expect(res.json()).toEqual({ error: 'the root handler answered' })
    })

    it('is not affected by a root error handler registered after the proxy', async () => {
      app = await buildAppWithRootErrorHandler()

      const res = await app.inject({ method: 'POST', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: CSRF_ERROR_CODE, reason: 'missing_secret' })
    })

    it('passes an upstream 403 through with its own body, unlike a CSRF rejection', async () => {
      upstream.respondWith((_req, res) => {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end('{"code":403,"message":"User is not an admin"}')
      })
      app = await buildProxyApp(freshSession())
      const session = trackSession(app)

      const res = await injectWithCsrf(app, { method: 'POST', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ code: 403, message: 'User is not an admin' })
      expect(res.json()).not.toHaveProperty('error', CSRF_ERROR_CODE)
      expect(await session.stored()).not.toBeNull()
    })
  })
})
