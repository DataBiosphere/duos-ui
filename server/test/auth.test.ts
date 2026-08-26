import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import type { PostgresDb } from '@fastify/postgres'
import type { Configuration } from 'openid-client'
import { createPgSessionStore } from '../src/session/pgStore.js'
import { csrfPluginOptions } from '../src/auth/csrf.js'
import { handleLogin } from '../src/auth/login.js'
import { handleCallback } from '../src/auth/callback.js'
import { handleLogout } from '../src/auth/logout.js'
import { getMe } from '../src/auth/me.js'
import '../src/types/session.js'

// ---------------------------------------------------------------------------
// Story 2-I: integration tests for the full BFF OAuth flow.
//
// The per-handler unit tests (login/callback/logout/me.test.ts) hand-build the
// request/reply and mock at the module boundary, so they never exercise the
// real Fastify route lifecycle, the real @fastify/session middleware, or the
// session store round-trip. This suite wires the REAL handlers onto a REAL
// @fastify/session (over an in-memory `user_sessions` stand-in) and drives them
// through `app.inject()` with cookie replay — the same harness style as
// session.test.ts.
//
// Boundary: openid-client is mocked here at the function level
// (authorizationCodeGrant / buildAuthorizationUrl / tokenRevocation) so no
// network or crypto runs. What that leaves unproven — the real state check,
// PKCE verification, and id_token signature/iss/aud/exp validation — is covered
// by authCrypto.test.ts, which lets the real authorizationCodeGrant run against
// a fake B2C served through config[customFetch].
// ---------------------------------------------------------------------------

// Mock getOidcConfig() (network discovery) but keep the rest of oidcClient real
// — crucially `pkce`, so login generates a real verifier/state/challenge, and
// `requireEnv`, so its env-var validation is exercised for real.
vi.mock('../src/auth/oidcClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/oidcClient.js')>()
  return { ...actual, getOidcConfig: vi.fn() }
})

// Mock only the three openid-client functions that would otherwise hit the
// network; everything else (helpers, types) stays real.
vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>()
  return {
    ...actual,
    buildAuthorizationUrl: vi.fn(),
    authorizationCodeGrant: vi.fn(),
    tokenRevocation: vi.fn(),
  }
})

const ENV = {
  DUOS_OAUTH_REDIRECT_URI: 'https://local.dsde-dev.broadinstitute.org:3000/auth/callback',
  DUOS_AZURE_CLIENT_ID: 'test-client-id',
  DUOS_API_URL: 'https://consent.dsde-dev.broadinstitute.org',
}
const SECRET = 'test-secret-that-is-at-least-32-characters'

// ---------------------------------------------------------------------------
// In-memory stand-in for the two Postgres tables the auth flow touches:
//   - user_sessions       (read/written by createPgSessionStore)
//   - user_session_audit  (UPDATEd by handleLogout)
// It honours the exact SQL the store + logout issue, and records enough to
// assert on. `set` awaits a macrotask to mimic the real DB round-trip — the
// async gap between the handler resolving and @fastify/session's onSend save is
// exactly the window the ERR_HTTP_HEADERS_SENT double-send fix guards.
// ---------------------------------------------------------------------------
function makeInMemoryPg(rows = new Map<string, { sess: unknown, expire: Date }>()) {
  const setSids: string[] = []
  const auditUpdates: string[] = []
  const query = async (sql: string, params: unknown[] = []) => {
    if (sql.includes('SELECT sess FROM user_sessions')) {
      const row = rows.get(params[0] as string)
      return row && row.expire.getTime() > Date.now()
        ? { rows: [{ sess: row.sess }] }
        : { rows: [] }
    }
    if (sql.includes('INSERT INTO user_sessions')) {
      await new Promise(resolve => setTimeout(resolve, 0)) // simulate DB latency
      const [sid, sess, maxAgeMs] = params as [string, unknown, number]
      setSids.push(sid)
      rows.set(sid, { sess, expire: new Date(Date.now() + maxAgeMs) })
      return { rows: [] }
    }
    if (sql.includes('DELETE FROM user_sessions')) {
      rows.delete(params[0] as string)
      return { rows: [] }
    }
    if (sql.includes('UPDATE user_session_audit')) {
      auditUpdates.push(params[0] as string)
      return { rows: [] }
    }
    return { rows: [] }
  }
  return { pg: { query } as unknown as PostgresDb, rows, setSids, auditUpdates }
}

async function buildAuthApp(pg: PostgresDb, errorLog?: string[]): Promise<FastifyInstance> {
  const app = Fastify(
    errorLog
      ? { logger: { level: 'error', stream: { write: (line: string) => { errorLog.push(line) } } } }
      : { logger: false },
  )
  // handleLogout reads request.server.pg; the real app gets it from
  // @fastify/postgres, which needs a live DB — decorate the stand-in instead.
  app.decorate('pg', pg as never)
  await app.register(fastifyCookie)
  // Mirror index.ts's session config exactly — rolling:false and
  // saveUninitialized:false are load-bearing for the double-send fix.
  await app.register(fastifySession, {
    secret: SECRET,
    store: createPgSessionStore(pg),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    },
    saveUninitialized: false,
    rolling: false,
  })
  // Real CSRF plugin, registered with index.ts's own options — after
  // @fastify/session, so the token secret lives in the session. The options are
  // imported rather than restated: registered with the plugin's bare defaults,
  // as this was through story 3-D, these tests would have accepted a token in
  // the body or under three other header spellings that production rejects.
  await app.register(fastifyCsrf, csrfPluginOptions)

  app.post('/auth/login', handleLogin)
  app.get('/auth/callback', handleCallback)
  app.get('/auth/csrf-token', async (_request, reply) => reply.send({ token: reply.generateCsrf() }))
  app.post('/auth/logout', { onRequest: app.csrfProtection }, handleLogout)
  app.get('/auth/me', getMe)
  return app
}

// A token response shaped like openid-client's v6 TokenEndpointResponse helper.
function makeTokens(claims: Record<string, unknown> | undefined) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    id_token: 'test-id-token',
    claims: () => claims,
    expiresIn: () => 3600,
  } as never
}

function sessionCookieHeader(res: { cookies: Array<{ name: string, value: string }> }): string {
  // The rotated callback response carries TWO sessionId Set-Cookie headers: a
  // clear of the pre-auth cookie (empty value) followed by the new session's
  // cookie. Mirror the browser: the last non-empty value wins.
  const cookies = res.cookies.filter(c => c.name === 'sessionId' && c.value !== '')
  const cookie = cookies[cookies.length - 1]
  if (!cookie) throw new Error('no session cookie set')
  return `${cookie.name}=${cookie.value}`
}

describe('BFF OAuth flow (integration, openid-client mocked at the function boundary)', () => {
  let app: FastifyInstance
  let rows: Map<string, { sess: unknown, expire: Date }>
  let auditUpdates: string[]

  beforeEach(async () => {
    Object.assign(process.env, ENV)

    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset()
      .mockResolvedValue({ serverMetadata: () => ({}) } as unknown as Configuration)

    const oidc = await import('openid-client')
    // login stores `state` in the session directly; the returned URL only needs
    // to be a valid URL so login can read `.href`.
    vi.mocked(oidc.buildAuthorizationUrl).mockReset()
      .mockReturnValue(new URL('https://duosdev.b2clogin.com/authorize?state=stub'))
    vi.mocked(oidc.authorizationCodeGrant).mockReset()
      .mockResolvedValue(makeTokens({ email: 'user@example.com' }))
    vi.mocked(oidc.tokenRevocation).mockReset().mockResolvedValue(undefined)

    const fake = makeInMemoryPg()
    rows = fake.rows
    auditUpdates = fake.auditUpdates
    app = await buildAuthApp(fake.pg)
  })

  afterEach(async () => {
    await app.close()
    for (const key of Object.keys(ENV)) delete process.env[key]
  })

  // Drives the real login handler and returns the session cookie so a
  // subsequent callback can resume the same session.
  async function login(returnTo?: string) {
    const url = returnTo ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` : '/auth/login'
    const res = await app.inject({ method: 'POST', url })
    return { res, cookie: sessionCookieHeader(res) }
  }

  // Fetches a CSRF token bound to the given session cookie.
  async function csrfToken(cookie: string): Promise<string> {
    const res = await app.inject({ method: 'GET', url: '/auth/csrf-token', headers: { cookie } })
    return res.json().token as string
  }

  // Full login→callback. The callback rotates the session (story 5-C), so the
  // authenticated cookie is the one the CALLBACK response sets — the login
  // cookie is dead afterwards. Returns both so tests can assert on the old one.
  async function authenticate(returnTo?: string) {
    const { cookie: preAuthCookie } = await login(returnTo)
    const res = await app.inject({
      method: 'GET',
      url: '/auth/callback?code=test-code&state=test-state',
      headers: { cookie: preAuthCookie },
    })
    return { res, cookie: sessionCookieHeader(res), preAuthCookie }
  }

  describe('POST /auth/login', () => {
    it('persists PKCE verifier/state and returnTo, and sets an HttpOnly Lax cookie', async () => {
      const { res } = await login('/datalibrary')

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ redirectUrl: 'https://duosdev.b2clogin.com/authorize?state=stub' })

      const cookie = res.cookies.find(c => c.name === 'sessionId')
      expect(cookie).toBeDefined()
      expect(cookie!.httpOnly).toBe(true)
      expect(String(cookie!.sameSite).toLowerCase()).toBe('lax')

      // Exactly one session row, holding the pre-auth PKCE material.
      expect(rows.size).toBe(1)
      const sess = [...rows.values()][0].sess as Record<string, unknown>
      expect(sess.pkceVerifier).toEqual(expect.any(String))
      expect(sess.pkceState).toEqual(expect.any(String))
      expect(sess.returnTo).toBe('/datalibrary')
    })
  })

  describe('GET /auth/callback', () => {
    it('round-trips the PKCE verifier/state from login through the session into the token exchange', async () => {
      const oidc = await import('openid-client')

      const { cookie } = await login()
      const storedSess = [...rows.values()][0].sess as Record<string, string>

      await app.inject({
        method: 'GET',
        url: '/auth/callback?code=test-code&state=test-state',
        headers: { cookie },
      })

      // The verifier/state handed to the grant are exactly what login persisted
      // — proving login and callback agree on the session keys, which the
      // hand-fed unit test cannot show.
      expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(URL),
        { pkceCodeVerifier: storedSess.pkceVerifier, expectedState: storedSess.pkceState },
      )
    })

    it('redirects to a legitimate returnTo path intact after a full login→callback', async () => {
      const { cookie } = await login('/datalibrary?filter=x')

      const res = await app.inject({
        method: 'GET',
        url: '/auth/callback?code=test-code&state=test-state',
        headers: { cookie },
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/datalibrary?filter=x')
    })

    it('collapses an open-redirect returnTo to / across the flow', async () => {
      const { cookie } = await login('https://evil.com')

      const res = await app.inject({
        method: 'GET',
        url: '/auth/callback?code=test-code&state=test-state',
        headers: { cookie },
      })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/')
    })

    it('leaves exactly one persisted session, holding tokens and no PKCE material', async () => {
      await authenticate()

      // Rotation (story 5-C) leaves one row: the fresh post-auth session. The
      // PKCE fields died with the destroyed pre-auth row.
      expect(rows.size).toBe(1)
      const sess = [...rows.values()][0].sess as Record<string, unknown>
      expect(sess.pkceVerifier).toBeUndefined()
      expect(sess.pkceState).toBeUndefined()
      expect(sess.accessToken).toBe('test-access-token')
      expect(sess.userId).toBe('user@example.com')
    })

    it('responds 400 token_missing_email_claim when the id_token carries no email', async () => {
      const oidc = await import('openid-client')
      vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue(makeTokens({ sub: 'abc123' }))

      const res = await app.inject({ method: 'GET', url: '/auth/callback?code=c&state=s' })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toEqual({ error: 'token_missing_email_claim' })
    })
  })

  describe('session fixation protection (story 5-C)', () => {
    it('rotates the sessionId cookie across the callback', async () => {
      const { cookie, preAuthCookie } = await authenticate()

      expect(cookie).not.toBe(preAuthCookie)
    })

    it('authenticates /auth/me with the NEW cookie — tokens survived the rotation', async () => {
      const { cookie } = await authenticate()

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200, ok: true, json: async () => ({ email: 'user@example.com' }),
      }))
      const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })
      vi.unstubAllGlobals()

      expect(me.statusCode).toBe(200)
    })

    it('rejects a replay of the PRE-AUTH cookie with 401 — a fixated sid never authenticates', async () => {
      const { preAuthCookie } = await authenticate()

      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie: preAuthCookie } })
      vi.unstubAllGlobals()

      expect(me.statusCode).toBe(401)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('destroys the pre-auth session row in the store', async () => {
      const { cookie: loginCookie } = await login()
      const preAuthSid = [...rows.keys()][0]

      await app.inject({
        method: 'GET',
        url: '/auth/callback?code=test-code&state=test-state',
        headers: { cookie: loginCookie },
      })

      expect(rows.has(preAuthSid)).toBe(false)
      expect(rows.size).toBe(1)
    })
  })

  describe('idp sub-provider derivation (observed via /auth/me)', () => {
    async function idpAfterCallback(claims: Record<string, unknown>): Promise<unknown> {
      const oidc = await import('openid-client')
      vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue(makeTokens(claims))

      const { cookie } = await authenticate()

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200, ok: true, json: async () => ({ email: 'user@example.com' }),
      }))
      const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })
      vi.unstubAllGlobals()
      return me.json().idp
    }

    it('derives \'google\' from the B2C idp claim google.com', async () => {
      expect(await idpAfterCallback({ email: 'user@example.com', idp: 'google.com' })).toBe('google')
    })

    it('derives \'microsoft\' when the idp claim is absent', async () => {
      expect(await idpAfterCallback({ email: 'user@example.com' })).toBe('microsoft')
    })
  })

  describe('GET /auth/me', () => {
    it('returns 401 without hitting the upstream API when unauthenticated', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      const res = await app.inject({ method: 'GET', url: '/auth/me' })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ authenticated: false })
      expect(fetchSpy).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })

    it('returns the upstream profile and session idp for an authenticated session', async () => {
      const oidc = await import('openid-client')
      vi.mocked(oidc.authorizationCodeGrant)
        .mockResolvedValue(makeTokens({ email: 'user@example.com', idp: 'google.com' }))

      const { cookie } = await authenticate()

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200, ok: true, json: async () => ({ email: 'user@example.com', displayName: 'Test User' }),
      }))
      const res = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })
      vi.unstubAllGlobals()

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({
        authenticated: true,
        user: { email: 'user@example.com', displayName: 'Test User' },
        idp: 'google',
      })
    })
  })

  describe('POST /auth/logout', () => {
    it('destroys the session, stamps the audit record, and clears the cookie', async () => {
      const { cookie } = await authenticate()
      expect(rows.size).toBe(1)

      const token = await csrfToken(cookie)
      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { cookie, 'x-csrf-token': token },
      })

      expect(res.statusCode).toBe(204)
      expect(rows.size).toBe(0) // session row deleted
      expect(auditUpdates).toHaveLength(1) // end_reason='logout' UPDATE issued
      const cleared = res.cookies.find(c => c.name === 'sessionId')
      expect(cleared).toBeDefined()
      expect(cleared!.value).toBe('') // cookie cleared

      // The destroyed session no longer authenticates.
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })
      expect(me.statusCode).toBe(401)
      expect(fetchSpy).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })
  })

  describe('CSRF protection (story 2-J)', () => {
    // Establishes an authenticated session and returns its (post-rotation) cookie.
    async function authenticatedCookie(): Promise<string> {
      const { cookie } = await authenticate()
      return cookie
    }

    it('rejects POST /auth/logout without an X-CSRF-Token (403) and leaves the session intact', async () => {
      const cookie = await authenticatedCookie()
      expect(rows.size).toBe(1)

      const res = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie } })

      expect(res.statusCode).toBe(403)
      expect(rows.size).toBe(1) // session NOT destroyed
      expect(auditUpdates).toHaveLength(0) // handler never ran
    })

    it('accepts POST /auth/logout with a valid session-bound X-CSRF-Token (204)', async () => {
      const cookie = await authenticatedCookie()
      const token = await csrfToken(cookie)

      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { cookie, 'x-csrf-token': token },
      })

      expect(res.statusCode).toBe(204)
      expect(rows.size).toBe(0)
    })

    it('rejects a token minted for one session when replayed on another session\'s cookie', async () => {
      // Session A fetches a token; session B (a different cookie) tries to use it.
      const cookieA = await authenticatedCookie()
      const tokenA = await csrfToken(cookieA)
      const cookieB = await authenticatedCookie()

      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { 'cookie': cookieB, 'x-csrf-token': tokenA },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('response lifecycle (regression guard for the ERR_HTTP_HEADERS_SENT double-send)', () => {
    it('completes login and callback with a single clean response and no already-sent error logged', async () => {
      // Fresh app wired to capture error-level logs. With the production session
      // config (rolling:false + the handlers' pre-response save()), the async
      // onSend save finds the session unmodified and skips it, so Fastify never
      // fires a second reply.send(). A regression (e.g. flipping rolling back on)
      // would surface here as an "already sent"/ERR_HTTP_HEADERS_SENT log line.
      const errorLog: string[] = []
      const fake = makeInMemoryPg()
      const guardedApp = await buildAuthApp(fake.pg, errorLog)

      // Each request must persist the session an EXACT number of times. The
      // double-send bug is a redundant onSend save racing the handler's own
      // save(); measuring the store-write delta per request catches that
      // directly. Login writes once. The callback writes exactly twice, both to
      // the NEW sid: regenerate() persists the fresh empty session, then the
      // handler's save() persists the tokens. A regression (e.g. flipping
      // `rolling` back on) makes onSend re-save the cookie-bearing callback
      // request, adding a third write.
      const beforeLogin = fake.setSids.length
      const loginRes = await guardedApp.inject({ method: 'POST', url: '/auth/login' })
      expect(loginRes.statusCode).toBe(200)
      expect(fake.setSids.length - beforeLogin).toBe(1)
      const loginSid = fake.setSids[fake.setSids.length - 1]
      const cookie = sessionCookieHeader(loginRes)

      const beforeCallback = fake.setSids.length
      const cbRes = await guardedApp.inject({
        method: 'GET',
        url: '/auth/callback?code=c&state=s',
        headers: { cookie },
      })
      expect(cbRes.statusCode).toBe(302)
      const callbackWrites = fake.setSids.slice(beforeCallback)
      expect(callbackWrites).toHaveLength(2)
      expect(new Set(callbackWrites).size).toBe(1) // both writes hit the rotated sid
      expect(callbackWrites[0]).not.toBe(loginSid)

      await guardedApp.close()

      const joined = errorLog.join('\n')
      expect(joined).not.toMatch(/already sent|ERR_HTTP_HEADERS_SENT|FST_ERR_REP/i)
    })
  })
})
