import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import http from 'node:http'
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { gzipSync } from 'node:zlib'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { RefreshFailedError } from '../src/auth/refresh.js'
import { PROXY_PREFIX, REFRESH_WINDOW_SECONDS, UNAUTHENTICATED_PATHS, apiProxy, upstreamPath } from '../src/proxy/apiProxy.js'

// refreshAccessToken is replaced so the tests never reach B2C; RefreshFailedError
// stays the real class so the proxy's instanceof branch is exercised rather than
// stubbed. Story 3-B's own tests cover what refresh does internally — here it is
// only interesting as a call that succeeds, fails fatally, or fails transiently.
vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

const nowSeconds = (): number => Math.floor(Date.now() / 1000)

interface ReceivedRequest {
  method: string
  url: string
  headers: IncomingHttpHeaders
  body: Buffer
}

interface Upstream {
  origin: string
  received: ReceivedRequest[]
  /** The last request the upstream saw — the assertion target for header/path tests. */
  last: () => ReceivedRequest
  respondWith: (handler: (req: IncomingMessage, res: ServerResponse) => void) => void
  close: () => Promise<void>
}

/**
 * A real HTTP server standing in for the DUOS API.
 *
 * Real rather than a mocked `fetch`: the point of most of these tests is what
 * actually goes out on the wire — that a 2 MB body was streamed rather than
 * rejected, that a gzip response arrived undisturbed, that the session cookie
 * never left the BFF. A stub of undici would be asserting on the mock.
 */
async function startUpstream(): Promise<Upstream> {
  const received: ReceivedRequest[] = []
  let handler = (_req: IncomingMessage, res: ServerResponse): void => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end('{"ok":true}')
  }

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      received.push({
        method: req.method ?? '',
        url: req.url ?? '',
        headers: req.headers,
        body: Buffer.concat(chunks),
      })
      handler(req, res)
    })
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as AddressInfo

  return {
    origin: `http://127.0.0.1:${port}`,
    received,
    last: () => {
      const last = received.at(-1)
      if (!last) throw new Error('the upstream received no requests')
      return last
    },
    respondWith: (next) => { handler = next },
    // Idempotent: one test closes the upstream mid-case to simulate an outage,
    // and afterEach closes it again.
    close: () => new Promise<void>((resolve, reject) => {
      if (!server.listening) {
        resolve()
        return
      }
      server.close(err => err ? reject(err) : resolve())
    }),
  }
}

interface FakeSession {
  accessToken?: string
  tokenExpiry?: number
}

/**
 * An app carrying just enough of the real one for the proxy to run:
 * `@fastify/cookie` (the fatal-refresh path calls `reply.clearCookie`) and
 * `trustProxy` (index.ts always sets it, and it is what populates
 * `request.ips`).
 *
 * The session is attached by a hook rather than by registering
 * `@fastify/session`, which would need a Postgres store. `session: undefined`
 * leaves `request.session` unset, which is what a deployment without the BFF
 * database configured actually looks like.
 */
async function buildProxyApp(session?: FakeSession): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: 1 })
  await app.register(fastifyCookie)
  if (session) {
    app.addHook('onRequest', async (request) => {
      ;(request as { session?: FakeSession }).session = session
    })
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
  const freshSession = (accessToken = 'session-access-token'): FakeSession => ({
    accessToken,
    tokenExpiry: nowSeconds() + 3600,
  })

  describe('upstreamPath', () => {
    it.each([
      [`${PROXY_PREFIX}/api/dataset/1`, '/api/dataset/1'],
      [`${PROXY_PREFIX}/status`, '/status'],
      [`${PROXY_PREFIX}/api/dar/v2?open=true`, '/api/dar/v2'],
      // The prefix on its own has no upstream path to map to; '/' keeps it a
      // valid URL rather than an empty source string.
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

      await app.inject({ method: 'DELETE', url: `${PROXY_PREFIX}/api/dataset/1` })

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
      const unregistered = Fastify({ logger: false })
      unregistered.register(apiProxy)

      await expect(unregistered.ready()).rejects.toThrow('DUOS_API_URL')
      await unregistered.close()
    })

    // reply.from() builds the upstream as new URL(path, base), which discards a
    // base path and then trips its own "source must be a relative path string"
    // guard — so every proxied request would 500. Better to fail at startup.
    it('fails to register when DUOS_API_URL carries a path', async () => {
      process.env.DUOS_API_URL = `${upstream.origin}/consent`
      const unregistered = Fastify({ logger: false })
      unregistered.register(apiProxy)

      await expect(unregistered.ready()).rejects.toThrow(/DUOS_API_URL.*must be a bare origin/s)
      await unregistered.close()
    })
  })

  describe('the authentication gate', () => {
    it('returns 401 without calling the upstream when there is no session at all', async () => {
      app = await buildProxyApp()

      const res = await app.inject({ method: 'GET', url: `${PROXY_PREFIX}/api/dataset/1` })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
      expect(upstream.received).toHaveLength(0)
    })

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
      const session: FakeSession = { accessToken: 'stale-token', tokenExpiry: nowSeconds() }
      const { refreshAccessToken } = await import('../src/auth/refresh.js')
      // The real refreshAccessToken mutates request.session in place; mirroring
      // that here proves the handler reads the token after the refresh rather
      // than capturing it beforehand.
      vi.mocked(refreshAccessToken).mockImplementation(async () => {
        session.accessToken = 'renewed-token'
        session.tokenExpiry = nowSeconds() + 3600
      })
      app = await buildProxyApp(session)

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
        expect.objectContaining({ name: 'sessionId', value: '' }),
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
      expect(res.cookies).toEqual([])
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

      await app.inject({
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

      const res = await app.inject({
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

      const res = await app.inject({
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
})
