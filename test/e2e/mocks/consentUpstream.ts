import type { IncomingMessage, ServerResponse } from 'node:http'
import { UNAUTHENTICATED_PATHS } from '../../../server/src/proxy/unauthenticatedPaths'
import { bearerToken, HttpError, requestUrl, sendJson } from './http'
import { defaultProfile, type ScenarioStore } from './scenarios'
import { MOCK_ECHO_PATH } from './settings'

/**
 * A stand-in for the Consent API, for the specs that sign in through the mock
 * provider (DT-4069). Real Consent rejects the mock's tokens, and `/auth/me`
 * forwards to Consent, so those specs need an upstream that accepts them.
 *
 * It is not an authorization check: it accepts any unexpired access token that
 * the mock provider issued, and looks up its scenario. Any other token gets a
 * 401, even one in the mock's shape, so a client-supplied `Authorization`
 * header that leaked through the proxy shows up as a failure.
 */

/** Keeps a long spec from growing the log without bound. */
const MAX_RECORDED_REQUESTS = 200

/**
 * The Consent paths that the BFF proxies with no token: the same list, so the
 * two cannot drift. Real Consent serves them to anyone, and the client signs out
 * on any 401, so a 401 here would end the test's session.
 */
function servePublicPath(response: ServerResponse, url: URL): boolean {
  if (!UNAUTHENTICATED_PATHS.has(url.pathname)) return false
  switch (url.pathname) {
    case '/status':
      sendJson(response, 200, { ok: true, degraded: false, systems: { sam: { ok: true, healthy: true, degraded: false, details: { ok: true } } } })
      break
    case '/tos/text/duos':
      response.writeHead(200, { 'content-type': 'text/plain' }).end('Mock terms of service (mock Consent upstream)')
      break
    case '/support/upload':
      sendJson(response, 200, { token: 'mock-upload-token' })
      break
    default:
      sendJson(response, 200, {})
  }
  return true
}

/**
 * The one Authorization header, or undefined. Node keeps only the first of
 * duplicate Authorization headers, so a proxy that sent the client's header
 * beside the session's could pass unseen; more than one is a 400 instead.
 */
function singleAuthorization(request: IncomingMessage): string | undefined {
  const values = request.headersDistinct.authorization ?? []
  if (values.length > 1) throw new HttpError(400, `${values.length} Authorization headers arrived; the proxy must send exactly one (mock Consent upstream)`)
  return values[0]
}

const PROVIDER_CONFLICT_MESSAGE = 'You previously signed in with a different provider. Sign in with that provider. (mock Consent upstream)'

function userMe(response: ServerResponse, store: ScenarioStore, key: string): void {
  const { provider, consent } = store.get(key)!
  switch (consent.userMe) {
    case 200:
      sendJson(response, 200, consent.profile ?? defaultProfile(provider.email))
      return
    case 401:
      sendJson(response, 401, { message: 'Unauthorized (mock Consent upstream)' })
      return
    case 404:
      sendJson(response, 404, { message: 'User not found (mock Consent upstream)' })
      return
    default:
      sendJson(response, 409, { message: PROVIDER_CONFLICT_MESSAGE, code: 409 })
  }
}

export function createConsentUpstream(options: { origin: string, store: ScenarioStore }) {
  const { origin, store } = options

  return function handle(request: IncomingMessage, response: ServerResponse): void {
    const url = requestUrl(request, origin)
    if (servePublicPath(response, url)) return
    const authorization = singleAuthorization(request) ?? null
    const token = bearerToken(authorization)
    const key = token === undefined ? undefined : store.lookupToken(token, 'access')?.key
    const stats = key === undefined ? undefined : store.stats(key)
    if (key === undefined || stats === undefined) {
      sendJson(response, 401, { message: 'The token is not a live access token from the mock provider (mock Consent upstream)' })
      return
    }

    stats.upstreamRequests.push({ method: request.method ?? 'GET', path: url.pathname, authorization })
    if (stats.upstreamRequests.length > MAX_RECORDED_REQUESTS) stats.upstreamRequests.shift()

    if (request.method === 'GET' && url.pathname === '/api/user/me') {
      userMe(response, store, key)
      return
    }
    if (url.pathname === MOCK_ECHO_PATH) {
      // The token that arrived, so a spec can prove the proxy sent the session's.
      sendJson(response, 200, { method: request.method, path: url.pathname, authorization, scenario: key })
      return
    }
    sendJson(response, 404, { message: `No mock route for ${request.method} ${url.pathname} (mock Consent upstream)` })
  }
}
