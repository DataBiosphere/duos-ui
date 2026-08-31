import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import type { PostgresDb } from '@fastify/postgres'
import type { Configuration } from 'openid-client'
import { createPgSessionStore } from '../src/session/pgStore.js'
import { sessionPluginOptions } from '../src/session/sessionOptions.js'
import { csrfPluginOptions, handleCsrfToken } from '../src/auth/csrf.js'
import { fetchMetadataGuard } from '../src/security/fetchMetadata.js'
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
//   - user_session_audit  (UPDATEd by handleCallback's rotation and handleLogout)
// It honours the exact SQL the store + logout issue, and records enough to
// assert on. `set` awaits a macrotask to mimic the real DB round-trip — the
// async gap between the handler resolving and @fastify/session's onSend save is
// exactly the window the ERR_HTTP_HEADERS_SENT double-send fix guards.
// ---------------------------------------------------------------------------
function makeInMemoryPg(rows = new Map<string, { sess: unknown, expire: Date }>()) {
  const setSids: string[] = []
  const auditUpdates: Array<{ reason: string, sid: string }> = []
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
      auditUpdates.push({
        reason: /end_reason = '(\w+)'/.exec(sql)?.[1] ?? 'unknown',
        sid: params[0] as string,
      })
      return { rows: [] }
    }
    return { rows: [] }
  }
  return { pg: { query } as unknown as PostgresDb, rows, setSids, auditUpdates }
}

interface AuthAppOptions {
  /** Collects error-level log lines for the double-send regression guard. */
  errorLog?: string[]
  /**
   * TEST ONLY — hands the session plugin a Strict (or None) cookie instead of
   * production's Lax. Only the SameSite suite below uses it, to build an app
   * whose cookie a browser would withhold from the B2C callback redirect.
   */
  sameSiteOverride?: 'strict' | 'none'
}

async function buildAuthApp(pg: PostgresDb, options: AuthAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(
    options.errorLog
      ? { logger: { level: 'error', stream: { write: (line: string) => { options.errorLog!.push(line) } } } }
      : { logger: false },
  )
  // handleLogout reads request.server.pg; the real app gets it from
  // @fastify/postgres, which needs a live DB — decorate the stand-in instead.
  app.decorate('pg', pg as never)
  await app.register(fastifyCookie)
  // index.ts's own session options, imported rather than restated: sameSite,
  // rolling:false, and saveUninitialized:false are all asserted in this file,
  // and a local copy would keep those assertions green after production
  // changed. See src/session/sessionOptions.ts.
  await app.register(fastifySession, sessionPluginOptions({
    secret: SECRET,
    store: createPgSessionStore(pg),
    sameSiteOverride: options.sameSiteOverride,
  }))
  // Real CSRF plugin, registered with index.ts's own options — after
  // @fastify/session, so the token secret lives in the session. The options are
  // imported rather than restated: registered with the plugin's bare defaults,
  // as this was through story 3-D, these tests would have accepted a token in
  // the body or under three other header spellings that production rejects.
  await app.register(fastifyCsrf, csrfPluginOptions)

  // Routes registered exactly as index.ts registers them — the shared
  // handleCsrfToken (gated since 5-B) and the Fetch Metadata guard on
  // /auth/me. Copies here would let the production wiring drift untested.
  app.post('/auth/login', handleLogin)
  app.get('/auth/callback', handleCallback)
  app.get('/auth/csrf-token', handleCsrfToken)
  app.post('/auth/logout', { onRequest: app.csrfProtection }, handleLogout)
  app.get('/auth/me', { onRequest: fetchMetadataGuard }, getMe)
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
  // Preserve browser semantics: the last sessionId Set-Cookie header wins.
  const cookies = res.cookies.filter(c => c.name === 'sessionId')
  const cookie = cookies[cookies.length - 1]
  if (!cookie || cookie.value === '') throw new Error('no session cookie set')
  return `${cookie.name}=${cookie.value}`
}

/**
 * Models the browser's SameSite decision for the one navigation the whole flow
 * depends on: B2C's 302 back to `/auth/callback`.
 *
 * `b2clogin.com` and `*.broadinstitute.org` are different registrable domains,
 * so that redirect is a **cross-site, top-level GET navigation**. Per RFC
 * 6265bis a `Lax` (or `None`) cookie is sent on it; a `Strict` cookie is
 * withheld, and the callback then arrives on a fresh, empty session. This
 * assumes B2C returns via GET — `response_mode=query`, the code-flow default.
 * With `response_mode=form_post` the redirect back would be a cross-site POST
 * and even `Lax` would withhold the cookie. See ADR-012.
 *
 * `app.inject()` has no cookie jar, so the decision has to be made explicitly.
 * It is read from the `SameSite` attribute the app actually set on the login
 * response, not from a constant — so flipping the shared session config
 * changes what this returns, and the Lax test below fails.
 */
function cookieAfterB2cRedirect(
  res: { cookies: Array<{ name: string, value: string, sameSite?: string }> },
): string | undefined {
  const cookie = res.cookies.find(c => c.name === 'sessionId')
  if (!cookie) throw new Error('no session cookie set')
  // An absent attribute is Lax in every current browser.
  const attribute = String(cookie.sameSite ?? 'lax').toLowerCase()
  switch (attribute) {
    case 'lax':
    case 'none':
      return `${cookie.name}=${cookie.value}`
    case 'strict':
      return undefined
    default:
      throw new Error(`unhandled SameSite attribute '${attribute}' — extend this browser model`)
  }
}

/**
 * Replaces the suite's default permissive `authorizationCodeGrant` mock with
 * one that performs openid-client v6's real state check, transcribed from
 * `oauth4webapi`'s `validateAuthResponse`:
 *
 *   - no `expectedState` (a sessionless callback) → any `state` in the URL is
 *     rejected outright;
 *   - an `expectedState` that does not match the URL's `state` → rejected;
 *   - a match → the exchange proceeds.
 *
 * The real behavior is already proven against a fake B2C in authCrypto.test.ts;
 * this reproduces it here because the default mock ignores `checks` entirely,
 * which would let a sessionless callback succeed and hide exactly the failure
 * the Strict test is meant to show.
 */
function mockStateCheckingGrant(
  oidc: typeof import('openid-client'),
  claims: Record<string, unknown> = { email: 'user@example.com' },
): void {
  vi.mocked(oidc.authorizationCodeGrant).mockImplementation(async (_config, currentUrl, checks) => {
    const state = new URL(String(currentUrl)).searchParams.get('state')
    const expected = checks?.expectedState
    if (typeof expected !== 'string') {
      if (state !== null) throw new Error('unexpected "state" response parameter encountered')
    }
    else if (state !== expected) {
      throw new Error(state === null
        ? 'response parameter "state" missing'
        : 'unexpected "state" response parameter value')
    }
    return makeTokens(claims)
  })
}

describe('BFF OAuth flow (integration, openid-client mocked at the function boundary)', () => {
  let app: FastifyInstance
  let rows: Map<string, { sess: unknown, expire: Date }>
  let auditUpdates: Array<{ reason: string, sid: string }>

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

  // The callback rotates the session; return both cookies for assertions.
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

  // -------------------------------------------------------------------------
  // SameSite on the B2C callback redirect (DT-3996).
  //
  // The session cookie is `SameSite=Lax` by necessity, not by preference, and
  // the code comment saying so was the only record of it. These two tests make
  // the claim executable: the browser model above reads the attribute the app
  // really set, so the pair is a mutation test on the shared session config —
  // set `sameSite: 'strict'` in src/session/sessionOptions.ts and the Lax test
  // fails at the cookie-withheld step. Full reasoning: ADR-012.
  // -------------------------------------------------------------------------
  describe('SameSite on the B2C callback redirect (DT-3996)', () => {
    it('Lax: the browser sends the cookie on the cross-site redirect, so the callback completes', async () => {
      const oidc = await import('openid-client')
      mockStateCheckingGrant(oidc)

      const { res, cookie } = await login('/datalibrary')
      const stored = [...rows.values()][0].sess as Record<string, string>

      // Production's attribute is Lax, so the model sends the cookie.
      const sent = cookieAfterB2cRedirect(res)
      expect(sent).toBe(cookie)

      const callback = await app.inject({
        method: 'GET',
        url: `/auth/callback?code=test-code&state=${encodeURIComponent(stored.pkceState)}`,
        headers: { cookie: sent! },
      })

      // The session survived the redirect, so the real PKCE material reached
      // the exchange and the state check passed.
      expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(URL),
        { pkceCodeVerifier: stored.pkceVerifier, expectedState: stored.pkceState },
      )
      expect(callback.statusCode).toBe(302)
      expect(callback.headers.location).toBe('/datalibrary')
    })

    it('Strict: the browser withholds the cookie, so the callback is sessionless and every login fails', async () => {
      const oidc = await import('openid-client')
      mockStateCheckingGrant(oidc)

      // The only caller of the Strict override — an app configured the way the
      // "why not Strict?" question proposes.
      const fake = makeInMemoryPg()
      const strictApp = await buildAuthApp(fake.pg, { sameSiteOverride: 'strict' })
      try {
        const loginRes = await strictApp.inject({ method: 'POST', url: '/auth/login' })
        expect(loginRes.statusCode).toBe(200)
        const stored = [...fake.rows.values()][0].sess as Record<string, string>

        // Strict → withheld from a cross-site-initiated navigation.
        expect(cookieAfterB2cRedirect(loginRes)).toBeUndefined()

        const callback = await strictApp.inject({
          method: 'GET',
          url: `/auth/callback?code=test-code&state=${encodeURIComponent(stored.pkceState)}`,
        })

        // A fresh, empty session: the verifier and state login persisted are
        // unreachable, so the exchange is attempted with neither.
        expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(URL),
          { pkceCodeVerifier: undefined, expectedState: undefined },
        )
        // openid-client rejects the unexpected `state`; the handler does not
        // catch it, so it surfaces as a 500 — sign-in is broken outright, not
        // degraded.
        expect(callback.statusCode).toBe(500)
        const sess = [...fake.rows.values()][0].sess as Record<string, unknown>
        expect(sess.accessToken).toBeUndefined()
      }
      finally {
        await strictApp.close()
      }
    })
  })

  describe('session fixation protection', () => {
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

    it('stamps the pre-auth audit row as rotated, not as an expiry', async () => {
      const { cookie: loginCookie } = await login()
      const preAuthSid = [...rows.keys()][0]

      await app.inject({
        method: 'GET',
        url: '/auth/callback?code=test-code&state=test-state',
        headers: { cookie: loginCookie },
      })

      expect(auditUpdates).toEqual([{ reason: 'rotated', sid: preAuthSid }])
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
      expect(auditUpdates.filter(u => u.reason === 'logout')).toHaveLength(1)
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
      expect(auditUpdates.filter(u => u.reason === 'logout')).toHaveLength(0) // handler never ran
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

    // The classic CSRF shape, end to end: an attacker page auto-submits a
    // <form action="https://duos/auth/logout" method="POST"> in the victim's
    // browser. The session cookie rides along (same-site siblings defeat Lax
    // — see index.ts), but no X-CSRF-Token can: a cross-origin form cannot
    // set a custom header. Asserted with the exact headers a browser form
    // POST carries, so this stays a faithful forgery even if the guard's
    // internals change.
    it('rejects a forged cross-origin form POST to /auth/logout, leaving the session intact', async () => {
      const cookie = await authenticatedCookie()
      expect(rows.size).toBe(1)

      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          cookie,
          'content-type': 'application/x-www-form-urlencoded',
          'origin': 'https://evil.example.org',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'navigate',
        },
        payload: 'submit=Sign+out',
      })

      expect(res.statusCode).toBe(403)
      expect(rows.size).toBe(1) // session survives
      expect(auditUpdates.filter(u => u.reason === 'logout')).toHaveLength(0) // handler never ran
    })
  })

  describe('/auth/csrf-token gate (story 5-B)', () => {
    it('rejects an anonymous request with 401 and mints no session row', async () => {
      const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
      // The pre-gate route wrote generateCsrf()'s secret into a fresh session,
      // which persisted a row and set a cookie — an anonymous-session mint per
      // caller. The gate answers before the secret exists.
      expect(rows.size).toBe(0)
      expect(res.cookies.find(c => c.name === 'sessionId')).toBeUndefined()
      expect(res.body).not.toContain('token')
    })

    it('rejects a pre-auth session (login begun, callback not reached) with 401', async () => {
      // login() persists PKCE material but no tokens — the session exists and
      // is real, but holds no user yet. Nothing pre-auth needs a CSRF token:
      // /auth/login itself is deliberately exempt.
      const { cookie } = await login()
      expect(rows.size).toBe(1)

      const res = await app.inject({ method: 'GET', url: '/auth/csrf-token', headers: { cookie } })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toEqual({ error: 'unauthenticated' })
    })

    it('issues a token to an authenticated session, persisted before the reply', async () => {
      const { cookie } = await authenticate()

      const res = await app.inject({ method: 'GET', url: '/auth/csrf-token', headers: { cookie } })

      expect(res.statusCode).toBe(200)
      expect(res.json().token).toEqual(expect.any(String))
      // The secret must be in the STORED session by the time the reply lands,
      // or a token could be handed out that the next request cannot verify.
      const sess = [...rows.values()][0].sess as Record<string, unknown>
      expect(sess._csrf).toEqual(expect.any(String))
    })
  })

  describe('Fetch Metadata on /auth/me (story 5-B)', () => {
    // /auth/me is a safe GET at the BFF, but it triggers Consent's
    // state-changing GET /api/user/me server-side — the ADR-009 residual. The
    // guard's full matrix lives in fetchMetadata.test.ts; these pin that
    // /auth/me is wired with it, that rejected requests never reach the
    // upstream, and that the legitimate shapes still work.
    // Use the rotated cookie so the guard is exercised as authenticated.
    async function authenticatedCookie(): Promise<string> {
      const { cookie } = await authenticate()
      return cookie
    }

    it.each([
      ['a same-site credentialed fetch (compromised sibling subdomain)', { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'cors' }],
      ['a same-site no-cors subresource', { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'no-cors' }],
      ['a top-level navigation', { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'navigate' }],
    ])('rejects %s with 403, without calling the upstream', async (_name, headers) => {
      const cookie = await authenticatedCookie()
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      const res = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie, ...headers } })
      vi.unstubAllGlobals()

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: 'cross_site_request_blocked' })
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('serves a legitimate same-origin fetch', async () => {
      const cookie = await authenticatedCookie()
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200, ok: true, json: async () => ({ email: 'user@example.com' }),
      }))

      const res = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { cookie, 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors' },
      })
      vi.unstubAllGlobals()

      expect(res.statusCode).toBe(200)
      expect(res.json().authenticated).toBe(true)
    })

    it('serves a request without Fetch Metadata headers (older browsers) — documented allow', async () => {
      const cookie = await authenticatedCookie()
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200, ok: true, json: async () => ({ email: 'user@example.com' }),
      }))

      const res = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })
      vi.unstubAllGlobals()

      expect(res.statusCode).toBe(200)
      expect(res.json().authenticated).toBe(true)
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
      const guardedApp = await buildAuthApp(fake.pg, { errorLog })

      // regenerate() writes the empty new session; save() writes its tokens.
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
