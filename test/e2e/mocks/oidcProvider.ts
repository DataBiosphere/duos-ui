import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHash, timingSafeEqual } from 'node:crypto'
import { decodeJwtPayload, randomToken, s256, signJwt, type SigningKey } from './jwt'
import { readBody, redirect, requestUrl, sendJson } from './http'
import {
  ACCESS_TOKEN_PREFIX,
  DEFAULT_SCENARIO_KEY,
  GOOGLE_IDP_CLAIM,
  isScenarioKey,
  MICROSOFT_IDP_CLAIM,
  mintToken,
  REFRESH_TOKEN_PREFIX,
  ScenarioError,
  scenarioKeyFromToken,
  type ScenarioStore,
  type ScenarioUpdate,
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
 * without `offline_access` it has no refresh token.
 *
 * Every behavior a spec can change is in `scenarios.ts`, keyed per test.
 */

export interface ProviderOptions {
  origin: string
  clientId: string
  clientSecret: string
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

const isHttpsUrl = (value: string | null): value is string => {
  try {
    return value !== null && new URL(value).protocol === 'https:'
  }
  catch {
    return false
  }
}

export function createOidcProvider(options: ProviderOptions) {
  const { origin, clientId, clientSecret, store, signingKey } = options
  const issuer = `${origin}/`
  const codes = new Map<string, PendingCode>()
  // The refresh tokens this process issued, with the scope each one carries.
  const refreshTokens = new Map<string, string>()

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
    if (basic) {
      const [id, secret] = Buffer.from(basic[1], 'base64').toString('utf8').split(':').map(decodeURIComponent)
      return id === clientId && safeEqual(secret ?? '', clientSecret)
    }
    return form.get('client_id') === clientId && safeEqual(form.get('client_secret') ?? '', clientSecret)
  }

  /** Mirrors the id_token claims that `callback.ts` reads from B2C. */
  function idToken(key: string): string {
    const { provider } = store.get(key)!
    const iat = nowSeconds()
    const claims: Record<string, unknown> = {
      iss: issuer,
      aud: clientId,
      sub: createHash('sha256').update(provider.email ?? key).digest('hex').slice(0, 32),
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

  function sendTokens(response: ServerResponse, key: string, scope: string): void {
    const { provider } = store.get(key)!
    const scopes = new Set(scope.split(' '))
    const body: Record<string, unknown> = {
      token_type: 'Bearer',
      expires_in: provider.accessTokenLifetimeSeconds,
      id_token: idToken(key),
      scope,
    }
    if (scopes.has(clientId)) body.access_token = mintToken(ACCESS_TOKEN_PREFIX, key, randomToken())
    if (scopes.has('offline_access') && provider.issueRefreshToken) {
      const refreshToken = mintToken(REFRESH_TOKEN_PREFIX, key, randomToken())
      refreshTokens.set(refreshToken, scope)
      body.refresh_token = refreshToken
    }
    sendJson(response, 200, body)
  }

  /** Answers a bad authorization request directly: redirecting could send it to an unchecked URI. */
  function authorizeRequestError(params: URLSearchParams): string | undefined {
    if (params.get('response_type') !== 'code') return 'response_type must be code'
    if (params.get('client_id') !== clientId) return 'unknown client_id'
    if (!isHttpsUrl(params.get('redirect_uri'))) return 'redirect_uri must be an https URL'
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
    const target = new URL(params.get('redirect_uri')!)
    const state = params.get('state')
    if (state !== null) target.searchParams.set('state', state)

    const authorizeError = store.get(key)!.provider.authorizeError
    if (authorizeError) {
      target.searchParams.set('error', authorizeError)
      target.searchParams.set('error_description', 'mock provider error')
      redirect(response, target.href)
      return
    }
    const code = randomToken()
    codes.set(code, {
      key,
      redirectUri: params.get('redirect_uri')!,
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
    sendTokens(response, pending.key, pending.scope)
  }

  function handleRefreshGrant(form: URLSearchParams, response: ServerResponse): void {
    const refreshToken = form.get('refresh_token') ?? ''
    const key = scenarioKeyFromToken(refreshToken, REFRESH_TOKEN_PREFIX)
    const scope = refreshTokens.get(refreshToken)
    if (key === undefined || scope === undefined || !store.has(key)) {
      oauthError(response, 400, 'invalid_grant', 'the refresh token is unknown')
      return
    }
    store.stats(key)!.refreshGrants++
    switch (store.get(key)!.provider.refresh) {
      case 'invalid_grant':
        oauthError(response, 400, 'invalid_grant', 'the refresh token has been revoked')
        return
      case 'server_error':
        oauthError(response, 503, 'server_error', 'the mock provider is unavailable')
        return
      case 'hang':
        // No answer. The BFF's own timeout ends the request; the socket closes with the server.
        return
      default:
        sendTokens(response, key, scope)
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
    const target = url.searchParams.get('post_logout_redirect_uri')
    if (!isHttpsUrl(target)) {
      oauthError(response, 400, 'invalid_request', 'post_logout_redirect_uri must be an https URL')
      return
    }
    const key = decodeJwtPayload(url.searchParams.get('id_token_hint') ?? '')?.mock_scenario
    if (isScenarioKey(key)) {
      const stats = store.stats(key)
      if (stats) stats.endSessions++
    }
    redirect(response, target)
  }

  async function handleControl(request: IncomingMessage, response: ServerResponse, key: string): Promise<void> {
    if (request.method === 'PUT') {
      try {
        const update = JSON.parse(await readBody(request) || '{}') as ScenarioUpdate
        sendJson(response, 200, { scenario: store.update(key, update) })
      }
      catch (err) {
        sendJson(response, 400, { error: err instanceof ScenarioError || err instanceof SyntaxError ? err.message : 'bad control request' })
      }
      return
    }
    if (request.method === 'DELETE') {
      store.delete(key)
      response.writeHead(204).end()
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
      await handleControl(request, response, decodeURIComponent(url.pathname.slice(MOCK_CONTROL_PATH.length + 1)))
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
