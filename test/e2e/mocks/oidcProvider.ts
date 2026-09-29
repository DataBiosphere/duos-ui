import type { IncomingMessage, ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { decodeJwtPayload, randomToken, s256, signJwt, type SigningKey } from './jwt'
import { HttpError, readBody, redirect, requestUrl, sendJson } from './http'
import {
  DEFAULT_SCENARIO_KEY,
  GOOGLE_IDP_CLAIM,
  isScenarioKey,
  MICROSOFT_IDP_CLAIM,
  ScenarioError,
  subjectFor,
  type ScenarioStore,
} from './scenarios'
import { MOCK_CONTROL_PATH } from './settings'

/**
 * A stand-in for the Azure B2C tenant, for the BFF's OAuth flow in CI (DT-4069).
 *
 * It serves what `server/src/auth/` asks of B2C, and no more: a discovery
 * document, a JWKS, `/authorize` (which redirects straight back with a code and
 * shows no login page), `/token` for the code and refresh grants, and an
 * end-session endpoint. The BFF reaches it through `DUOS_AZURE_ISSUER_URL`
 * alone, so pointing a server at it is an environment change.
 *
 * It keeps two B2C behaviors on purpose, because the BFF depends on both:
 * without the client ID in `scope` the token response has no access token, and
 * without `offline_access` it has no refresh token. Refresh tokens rotate: when
 * a refresh issues a replacement, the redeemed one is revoked, so a reused token
 * gets `invalid_grant`, which is what the single-flight guard in
 * server/src/auth/refresh.ts exists to prevent.
 *
 * Every behavior a spec can change is in `scenarios.ts`, keyed per test.
 */

export interface ProviderOptions {
  origin: string
  clientId: string
  clientSecret: string
  /** The exact `redirect_uri` values the client registered. */
  redirectUris: readonly string[]
  /** The exact `post_logout_redirect_uri` values the client registered. */
  postLogoutRedirectUris: readonly string[]
  store: ScenarioStore
  signingKey: SigningKey
}

interface PendingCode {
  key: string
  redirectUri: string
  codeChallenge: string
  scope: string
  expiresAt: number
}

const CODE_LIFETIME_MS = 60_000
const ID_TOKEN_LIFETIME_SECONDS = 3600

const nowSeconds = (): number => Math.floor(Date.now() / 1000)

const oauthError = (response: ServerResponse, status: number, error: string, description: string): void =>
  sendJson(response, status, { error, error_description: description })

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Registered URIs, keyed by themselves. A redirect uses the stored value, never
 * the request's copy, so no request can choose where the provider sends a browser.
 */
const registry = (uris: readonly string[]): ReadonlyMap<string, string> => new Map(uris.map(uri => [uri, uri]))

export function createOidcProvider(options: ProviderOptions) {
  const { origin, clientId, clientSecret, store, signingKey } = options
  const issuer = `${origin}/`
  const redirectUris = registry(options.redirectUris)
  const postLogoutRedirectUris = registry(options.postLogoutRedirectUris)
  const codes = new Map<string, PendingCode>()

  const discovery = {
    issuer,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/token`,
    end_session_endpoint: `${origin}/logout`,
    jwks_uri: `${origin}/discovery/keys`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['pairwise'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['openid', 'offline_access'],
    claims_supported: ['sub', 'email', 'name', 'idp', 'tfp'],
  }

  function authenticateClient(request: IncomingMessage, form: URLSearchParams): boolean {
    const basic = /^Basic (\S+)$/.exec(request.headers.authorization ?? '')
    if (!basic) return form.get('client_id') === clientId && safeEqual(form.get('client_secret') ?? '', clientSecret)
    try {
      const [id, secret] = Buffer.from(basic[1], 'base64').toString('utf8').split(':').map(decodeURIComponent)
      return id === clientId && safeEqual(secret ?? '', clientSecret)
    }
    catch {
      // A malformed percent-encoding is a failed authentication, not a server error.
      return false
    }
  }

  /** Mirrors the id_token claims that `callback.ts` reads from B2C. */
  function idToken(key: string, subject: string): string {
    const { provider } = store.get(key)!
    const iat = nowSeconds()
    const claims: Record<string, unknown> = {
      iss: issuer,
      aud: clientId,
      sub: subject,
      iat,
      nbf: iat,
      exp: iat + ID_TOKEN_LIFETIME_SECONDS,
      name: 'Mock Researcher',
      tfp: 'B2C_1A_SIGNUP_SIGNIN_MOCK',
      // Lets the end-session endpoint count the sign-out against its scenario.
      mock_scenario: key,
    }
    if (provider.email !== null) claims.email = provider.email
    if (provider.idp !== 'omit') claims.idp = provider.idp === 'google' ? GOOGLE_IDP_CLAIM : MICROSOFT_IDP_CLAIM
    return signJwt(signingKey, claims)
  }

  /**
   * `redeemed` is the refresh token a refresh grant spent. It is revoked only
   * when a replacement is issued: with none, the BFF keeps using it
   * (server/src/auth/refresh.ts), so revoking it would end a healthy session.
   */
  function sendTokens(response: ServerResponse, key: string, scope: string, subject: string, redeemed?: string): void {
    const { provider } = store.get(key)!
    const scopes = new Set(scope.split(' '))
    const lifetime = provider.accessTokenLifetimeSeconds
    const body: Record<string, unknown> = {
      token_type: 'Bearer',
      expires_in: lifetime,
      id_token: idToken(key, subject),
      scope,
    }
    if (scopes.has(clientId)) {
      // The Consent upstream rejects the token after this, as real Consent would.
      body.access_token = store.issueToken('access', { key, scope, subject, expiresAt: Date.now() + lifetime * 1000 })
    }
    if (scopes.has('offline_access') && provider.issueRefreshToken) {
      body.refresh_token = store.issueToken('refresh', { key, scope, subject, expiresAt: Number.POSITIVE_INFINITY })
      if (redeemed !== undefined) store.revokeToken(redeemed)
    }
    sendJson(response, 200, body)
  }

  function pruneExpiredCodes(): void {
    const now = Date.now()
    for (const [code, pending] of codes) {
      if (pending.expiresAt <= now) codes.delete(code)
    }
  }

  /** Answers a bad authorization request directly: redirecting could send it to an unchecked URI. */
  function authorizeRequestError(params: URLSearchParams): string | undefined {
    if (params.get('response_type') !== 'code') return 'response_type must be code'
    if (params.get('client_id') !== clientId) return 'unknown client_id'
    if (!redirectUris.has(params.get('redirect_uri') ?? '')) return 'redirect_uri is not registered'
    if (!params.get('scope')?.split(' ').includes('openid')) return 'scope must include openid'
    if (params.get('code_challenge_method') !== 'S256' || !params.get('code_challenge')) return 'PKCE S256 is required'
    const key = params.get('scenario') ?? DEFAULT_SCENARIO_KEY
    if (!isScenarioKey(key) || !store.has(key)) return `unknown scenario '${key}' — register it through the control API first`
    return undefined
  }

  function handleAuthorize(url: URL, response: ServerResponse): void {
    const params = url.searchParams
    const problem = authorizeRequestError(params)
    if (problem) {
      oauthError(response, 400, 'invalid_request', problem)
      return
    }
    const key = params.get('scenario') ?? DEFAULT_SCENARIO_KEY
    store.stats(key)!.authorizations++
    const redirectUri = redirectUris.get(params.get('redirect_uri')!)!
    const target = new URL(redirectUri)
    const state = params.get('state')
    if (state !== null) target.searchParams.set('state', state)

    const authorizeError = store.get(key)!.provider.authorizeError
    if (authorizeError) {
      target.searchParams.set('error', authorizeError)
      target.searchParams.set('error_description', 'mock provider error')
      redirect(response, target.href)
      return
    }
    pruneExpiredCodes()
    const code = randomToken()
    codes.set(code, {
      key,
      redirectUri,
      codeChallenge: params.get('code_challenge')!,
      scope: params.get('scope')!,
      expiresAt: Date.now() + CODE_LIFETIME_MS,
    })
    target.searchParams.set('code', code)
    redirect(response, target.href)
  }

  function handleCodeGrant(form: URLSearchParams, response: ServerResponse): void {
    const code = form.get('code') ?? ''
    const pending = codes.get(code)
    codes.delete(code) // single use, whatever the outcome
    const valid = pending !== undefined
      && pending.expiresAt > Date.now()
      && pending.redirectUri === form.get('redirect_uri')
      && pending.codeChallenge === s256(form.get('code_verifier') ?? '')
      && store.has(pending.key)
    if (!valid) {
      oauthError(response, 400, 'invalid_grant', 'the code is unknown, expired, used, or fails PKCE or redirect_uri')
      return
    }
    store.stats(pending.key)!.codeGrants++
    // `sub` is fixed here, at sign-in, and every refresh reuses it.
    sendTokens(response, pending.key, pending.scope, subjectFor(store.get(pending.key)!.provider.email))
  }

  function handleRefreshGrant(form: URLSearchParams, response: ServerResponse): void {
    const refreshToken = form.get('refresh_token') ?? ''
    const record = store.lookupToken(refreshToken, 'refresh')
    if (record === undefined) {
      oauthError(response, 400, 'invalid_grant', 'the refresh token is unknown, already redeemed, or revoked')
      return
    }
    const { key, scope, subject } = record
    store.stats(key)!.refreshGrants++
    switch (store.get(key)!.provider.refresh) {
      case 'invalid_grant':
        oauthError(response, 400, 'invalid_grant', 'the refresh token has been revoked')
        return
      case 'server_error':
        oauthError(response, 503, 'server_error', 'the mock provider is unavailable')
        return
      case 'hang':
        // No answer. The BFF gives up only at openid-client's 30-second default
        // timeout, which equals Playwright's default test timeout, so a spec that
        // uses `hang` must raise its own. The socket closes with the server.
        return
      default:
        // Rotation: a replacement revokes the redeemed token. A failed refresh
        // keeps it, so a retry after a transient error can still succeed.
        sendTokens(response, key, scope, subject, refreshToken)
    }
  }

  async function handleToken(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const form = new URLSearchParams(await readBody(request))
    if (!authenticateClient(request, form)) {
      oauthError(response, 401, 'invalid_client', 'client authentication failed')
      return
    }
    const grantType = form.get('grant_type')
    if (grantType === 'authorization_code') handleCodeGrant(form, response)
    else if (grantType === 'refresh_token') handleRefreshGrant(form, response)
    else oauthError(response, 400, 'unsupported_grant_type', `grant_type '${grantType}' is not supported`)
  }

  function handleEndSession(url: URL, response: ServerResponse): void {
    const target = postLogoutRedirectUris.get(url.searchParams.get('post_logout_redirect_uri') ?? '')
    if (target === undefined) {
      oauthError(response, 400, 'invalid_request', 'post_logout_redirect_uri is not registered')
      return
    }
    const key = decodeJwtPayload(url.searchParams.get('id_token_hint') ?? '')?.mock_scenario
    if (isScenarioKey(key)) {
      const stats = store.stats(key)
      if (stats) stats.endSessions++
    }
    redirect(response, target)
  }

  async function updateScenario(request: IncomingMessage, response: ServerResponse, key: string): Promise<void> {
    const body = await readBody(request)
    try {
      sendJson(response, 200, { scenario: store.update(key, JSON.parse(body || '{}')) })
    }
    catch (err) {
      if (!(err instanceof ScenarioError || err instanceof SyntaxError)) throw err
      sendJson(response, 400, { error: err.message })
    }
  }

  function deleteScenario(response: ServerResponse, key: string): void {
    try {
      if (store.delete(key)) response.writeHead(204).end()
      else sendJson(response, 404, { error: `unknown scenario '${key}'` })
    }
    catch (err) {
      if (!(err instanceof ScenarioError)) throw err
      sendJson(response, 400, { error: err.message })
    }
  }

  async function handleControl(request: IncomingMessage, response: ServerResponse, key: string): Promise<void> {
    if (!isScenarioKey(key)) throw new HttpError(400, 'a scenario key must be 1-64 letters, digits, _ or -')
    if (request.method === 'PUT') {
      await updateScenario(request, response, key)
      return
    }
    if (request.method === 'DELETE') {
      deleteScenario(response, key)
      return
    }
    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'use GET, PUT or DELETE' })
      return
    }
    const scenario = store.get(key)
    if (scenario) sendJson(response, 200, { scenario, stats: store.stats(key) })
    else sendJson(response, 404, { error: `unknown scenario '${key}'` })
  }

  return async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = requestUrl(request, origin)
    const route = `${request.method} ${url.pathname}`
    if (url.pathname.startsWith(`${MOCK_CONTROL_PATH}/`)) {
      // Not decoded: a valid key needs no percent-encoding, so an encoded one is a 400.
      await handleControl(request, response, url.pathname.slice(MOCK_CONTROL_PATH.length + 1))
      return
    }
    switch (route) {
      case 'GET /.well-known/openid-configuration':
        sendJson(response, 200, discovery)
        return
      case 'GET /discovery/keys':
        sendJson(response, 200, { keys: [signingKey.jwk] })
        return
      case 'GET /authorize':
        handleAuthorize(url, response)
        return
      case 'POST /token':
        await handleToken(request, response)
        return
      case 'GET /logout':
        handleEndSession(url, response)
        return
      default:
        sendJson(response, 404, { error: `no mock route for ${route}` })
    }
  }
}
