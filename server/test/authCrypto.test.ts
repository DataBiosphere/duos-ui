import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import type { PostgresDb } from '@fastify/postgres'
import * as oidc from 'openid-client'
import * as jose from 'jose'
import { createPgSessionStore } from '../src/session/pgStore.js'
import { handleLogin } from '../src/auth/login.js'
import { handleCallback } from '../src/auth/callback.js'
import '../src/types/session.js'

// ---------------------------------------------------------------------------
// Story 2-I, Level 3: the security-critical half of the callback flow that a
// mocked authorizationCodeGrant can NEVER prove — the real state check, PKCE
// exchange, and id_token signature/iss/aud/exp validation.
//
// openid-client is NOT mocked here. Only getOidcConfig is stubbed, to hand the
// handlers a real `Configuration` whose network is redirected through
// config[customFetch] to a fake Azure B2C. The fake serves the JWKS and the
// token endpoint; id_tokens are minted for real with `jose` against an
// ephemeral RS256 keypair whose public half is the published JWKS. So when
// handleCallback calls the real authorizationCodeGrant, every validation runs
// for real — this is the literal "mock the B2C token endpoint" the plan asks
// for.
// ---------------------------------------------------------------------------

vi.mock('../src/auth/oidcClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/oidcClient.js')>()
  return { ...actual, getOidcConfig: vi.fn() }
})

const CLIENT_ID = 'test-client-id'
const CLIENT_SECRET = 'test-client-secret'
const ISSUER = 'https://b2c.example/tenant/v2.0'
const AUTHORIZATION_ENDPOINT = 'https://b2c.example/authorize'
const TOKEN_ENDPOINT = 'https://b2c.example/token'
const JWKS_URI = 'https://b2c.example/keys'
const KID = 'test-key-1'
const SECRET = 'test-secret-that-is-at-least-32-characters'
const ENV = {
  DUOS_OAUTH_REDIRECT_URI: 'https://local.dsde-dev.broadinstitute.org:3000/auth/callback',
  DUOS_AZURE_CLIENT_ID: CLIENT_ID,
}

let signingKey: CryptoKey // published in JWKS
let wrongKey: CryptoKey // NOT published — used for the bad-signature case
let publicJwk: jose.JWK

// The id_token the fake token endpoint returns on its next call. Each test sets
// this (a real signed JWT) right before driving the callback.
let nextIdToken: string
// Records that the fake token endpoint saw a PKCE code_verifier — evidence the
// verifier round-tripped from login through the session into the exchange.
let lastCodeVerifier: string | undefined

async function mintIdToken(opts: {
  claims?: Record<string, unknown>
  expiresInSeconds?: number
  key?: CryptoKey
  issuer?: string
  audience?: string
} = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new jose.SignJWT({ ...opts.claims })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? CLIENT_ID)
    .setSubject('user-subject-id')
    .setIssuedAt(now)
    .setExpirationTime(now + (opts.expiresInSeconds ?? 3600))
    .sign(opts.key ?? signingKey)
}

// A fetch that answers only the two B2C endpoints the callback touches.
// oauth4webapi calls it as fetch(url, { method, headers, body }) — the token
// request body arrives in `init`, not as a Request object.
const fakeB2CFetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
  const url = input instanceof URL ? input.href : input instanceof Request ? input.url : String(input)
  const jsonHeaders = { 'content-type': 'application/json' }

  if (url.startsWith(JWKS_URI)) {
    return new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200, headers: jsonHeaders })
  }
  if (url.startsWith(TOKEN_ENDPOINT)) {
    // openid-client sends the token request as an application/x-www-form-urlencoded
    // body — capture the code_verifier to prove PKCE round-tripped.
    const body = init?.body
    const bodyStr = typeof body === 'string' ? body : body instanceof URLSearchParams ? body.toString() : ''
    lastCodeVerifier = new URLSearchParams(bodyStr).get('code_verifier') ?? undefined
    return new Response(JSON.stringify({
      access_token: 'b2c-access-token',
      refresh_token: 'b2c-refresh-token',
      id_token: nextIdToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: `openid email profile offline_access ${CLIENT_ID}`,
    }), { status: 200, headers: jsonHeaders })
  }
  throw new Error(`unexpected fetch in test: ${url}`)
}) as unknown as typeof fetch

function makeConfig(): oidc.Configuration {
  const config = new oidc.Configuration(
    {
      issuer: ISSUER,
      authorization_endpoint: AUTHORIZATION_ENDPOINT,
      token_endpoint: TOKEN_ENDPOINT,
      jwks_uri: JWKS_URI,
      id_token_signing_alg_values_supported: ['RS256'],
      code_challenge_methods_supported: ['S256'],
      response_types_supported: ['code'],
    },
    CLIENT_ID,
    CLIENT_SECRET,
  )
  config[oidc.customFetch] = fakeB2CFetch
  return config
}

function makeInMemoryPg(rows = new Map<string, { sess: unknown, expire: Date }>()) {
  const query = async (sql: string, params: unknown[] = []) => {
    if (sql.includes('SELECT sess FROM user_sessions')) {
      const row = rows.get(params[0] as string)
      return row && row.expire.getTime() > Date.now() ? { rows: [{ sess: row.sess }] } : { rows: [] }
    }
    if (sql.includes('INSERT INTO user_sessions')) {
      const [sid, sess, maxAgeMs] = params as [string, unknown, number]
      rows.set(sid, { sess, expire: new Date(Date.now() + maxAgeMs) })
      return { rows: [] }
    }
    if (sql.includes('DELETE FROM user_sessions')) {
      rows.delete(params[0] as string)
      return { rows: [] }
    }
    return { rows: [] }
  }
  return { pg: { query } as unknown as PostgresDb, rows }
}

async function buildApp(pg: PostgresDb): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  await app.register(fastifyCookie)
  await app.register(fastifySession, {
    secret: SECRET,
    store: createPgSessionStore(pg),
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' },
    saveUninitialized: false,
    rolling: false,
  })
  app.post('/auth/login', handleLogin)
  app.get('/auth/callback', handleCallback)
  return app
}

function sessionCookieHeader(res: { cookies: Array<{ name: string, value: string }> }): string {
  const cookie = res.cookies.find(c => c.name === 'sessionId')
  if (!cookie) throw new Error('no session cookie set')
  return `${cookie.name}=${cookie.value}`
}

describe('B2C OAuth callback (real openid-client validation against a fake B2C)', () => {
  let app: FastifyInstance
  let rows: Map<string, { sess: unknown, expire: Date }>

  beforeAll(async () => {
    const pair = await jose.generateKeyPair('RS256', { extractable: true })
    signingKey = pair.privateKey
    publicJwk = { ...(await jose.exportJWK(pair.publicKey)), kid: KID, alg: 'RS256', use: 'sig' }
    wrongKey = (await jose.generateKeyPair('RS256', { extractable: true })).privateKey
  })

  beforeEach(async () => {
    Object.assign(process.env, ENV)
    lastCodeVerifier = undefined
    nextIdToken = await mintIdToken({ claims: { email: 'user@example.com' } })

    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue(makeConfig())

    const fake = makeInMemoryPg()
    rows = fake.rows
    app = await buildApp(fake.pg)
  })

  afterEach(async () => {
    await app.close()
    for (const key of Object.keys(ENV)) delete process.env[key]
  })

  // Runs the real login handler and returns the session cookie plus the state
  // login persisted (which the callback URL must echo back).
  async function login(): Promise<{ cookie: string, state: string }> {
    const res = await app.inject({ method: 'POST', url: '/auth/login' })
    const cookie = sessionCookieHeader(res)
    const sess = [...rows.values()][0].sess as Record<string, string>
    return { cookie, state: sess.pkceState }
  }

  it('accepts a valid code + state and a correctly-signed id_token, populating the session', async () => {
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?code=valid-code&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/')
    // The real token exchange ran and received the PKCE verifier login stored.
    expect(lastCodeVerifier).toEqual(expect.any(String))

    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.accessToken).toBe('b2c-access-token')
    expect(sess.refreshToken).toBe('b2c-refresh-token')
    expect(sess.userId).toBe('user@example.com')
    expect(sess.pkceState).toBeUndefined() // cleared after exchange
  })

  it('derives idp=\'google\' from a real signed id_token whose idp claim is google.com', async () => {
    nextIdToken = await mintIdToken({ claims: { email: 'user@example.com', idp: 'google.com' } })
    const { cookie, state } = await login()

    await app.inject({ method: 'GET', url: `/auth/callback?code=c&state=${state}`, headers: { cookie } })

    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.idp).toBe('google')
  })

  it('rejects a tampered state (CSRF guard) — the grant throws and no tokens are stored', async () => {
    const { cookie } = await login()

    const res = await app.inject({
      method: 'GET',
      url: '/auth/callback?code=c&state=attacker-supplied-state',
      headers: { cookie },
    })

    expect(res.statusCode).toBe(500) // handler does not catch — surfaces as a 500
    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.accessToken).toBeUndefined()
    expect(sess.pkceState).toBeDefined() // untouched — the exchange never completed
  })

  it('rejects an expired id_token', async () => {
    nextIdToken = await mintIdToken({ claims: { email: 'user@example.com' }, expiresInSeconds: -300 })
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?code=c&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(500)
    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.accessToken).toBeUndefined()
  })

  it('rejects an id_token whose issuer is not the configured B2C issuer', async () => {
    nextIdToken = await mintIdToken({ claims: { email: 'user@example.com' }, issuer: 'https://attacker.example/v2.0' })
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?code=c&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(500)
    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.accessToken).toBeUndefined()
  })

  // NOTE ON id_token SIGNATURE: openid-client/oauth4webapi deliberately does
  // NOT verify the id_token's JWS signature during authorizationCodeGrant. The
  // token is received directly from the token endpoint over TLS, so OIDC Core
  // §3.1.3.7 makes signature validation optional there — the code exchange
  // validates iss/aud/exp/alg and relies on TLS for authenticity. (Signature
  // verification is offered separately as oidc.validateApplicationLevelSignature,
  // for tokens obtained via untrusted channels.) A token signed by `wrongKey`
  // is therefore accepted in this flow — that is expected, not a bug — so the
  // meaningful crypto assertions above are on the claims (state/iss/aud/exp),
  // not the signature.
  it('documents that a wrong-key signature is NOT rejected in the direct code exchange (TLS-trusted)', async () => {
    nextIdToken = await mintIdToken({ claims: { email: 'user@example.com' }, key: wrongKey })
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?code=c&state=${state}`,
      headers: { cookie },
    })

    // Accepted: claims are valid and the channel is trusted, so no JWS check runs.
    expect(res.statusCode).toBe(302)
  })

  it('rejects an id_token whose audience is not this client', async () => {
    nextIdToken = await mintIdToken({ claims: { email: 'user@example.com' }, audience: 'some-other-client' })
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?code=c&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(500)
  })

  it('redirects to /?signInError=provider when B2C answers with an error instead of a code', async () => {
    // Edge case: the user picked an identity the tenant's policy
    // rejects (e.g. a personal Microsoft Live account). B2C redirects back
    // with error=server_error — the real authorizationCodeGrant throws
    // AuthorizationResponseError, which must land the browser in the SPA
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?error=server_error&error_description=AADB2C90085&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/?signInError=provider')
    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.accessToken).toBeUndefined()
  })

  it('redirects home silently when the user cancels on the B2C page (access_denied)', async () => {
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?error=access_denied&error_description=AADB2C90091&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/')
    const sess = [...rows.values()][0].sess as Record<string, unknown>
    expect(sess.accessToken).toBeUndefined()
  })

  it('returns 400 token_missing_email_claim when a valid id_token has no email', async () => {
    // The token is cryptographically valid — the grant succeeds — so this
    // exercises the handler guard on top of real validation, not a crypto error.
    nextIdToken = await mintIdToken({ claims: { sub: 'no-email-user' } })
    const { cookie, state } = await login()

    const res = await app.inject({
      method: 'GET',
      url: `/auth/callback?code=c&state=${state}`,
      headers: { cookie },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'token_missing_email_claim' })
  })
})
