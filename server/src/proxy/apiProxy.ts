import type { FastifyInstance } from 'fastify'
import {
  registerUpstreamProxy,
  upstreamPath as stripPrefix,
  type UpstreamProxyOptions,
} from './upstreamProxy.js'
import { UNAUTHENTICATED_PATHS } from './unauthenticatedPaths.js'

/**
 * The DUOS API proxy (Phase 3).
 *
 * Every DUOS API call the client makes is forwarded with the session's B2C
 * access token attached, so the browser never holds a bearer token. The
 * machinery — streaming bodies, CSRF on unsafe methods, header hygiene on both
 * legs, response hardening — lives in upstreamProxy.ts (shared with the ECM
 * proxy since story 3-I); this module is what is specific to the DUOS API:
 * its prefix, its upstream, and the paths called unauthenticated today.
 */

export { CSRF_ERROR_CODE, REFRESH_WINDOW_SECONDS, UPSTREAM_POOL_CONNECTIONS } from './upstreamProxy.js'

export type ApiProxyOptions = UpstreamProxyOptions

/**
 * The BFF-side prefix. `/duos-api/api/dataset/1` → `${DUOS_API_URL}/api/dataset/1`.
 *
 * Public API surface between client and BFF: Phase 4 makes `getApiUrl()` return
 * this, at which point all 104 call sites keep their literal paths. Changing it
 * later means changing both ends together.
 *
 * One prefix, mapped to the upstream root: 9 of the client's 113 upstream paths
 * sit outside `/api` (`/status`, `/feature`, `/ontology/*`, …), so an `/api/*`
 * wildcard under-covers. `/duos-api/<path>` covers all of them with one rule
 * and cannot collide with the BFF's own routes.
 */
export const PROXY_PREFIX = '/duos-api'

// Its own module so the E2E mock Consent upstream (test/e2e/mocks) can serve the
// same list without importing the proxy's Fastify dependencies.
export { UNAUTHENTICATED_PATHS }

/**
 * The only *unsafe* requests exempt from CSRF: the signed-out Contact Us form.
 *
 * Keyed on method and path together, and deliberately narrower than
 * `UNAUTHENTICATED_PATHS` — that set also holds read-only endpoints (`/status`,
 * `/oauth2/configuration`, `/tos/text/duos`), so keying the exemption on it would
 * waive CSRF for an unsafe method against any of them.
 *
 * Nothing is exploitable either way today: allowlisted paths get no injected
 * `Authorization` and the caller's own cookie and `authorization` are stripped
 * before forwarding, so a forged write to one of them reaches the upstream
 * unauthenticated — a request anyone can already make without a victim, borrowing
 * no authority, which is the only thing CSRF protects. But that safety lives in
 * `rewriteRequestHeaders`, not here, and a path-keyed exemption would widen
 * silently if the allowlist or the token logic ever changed.
 *
 * Drift fails closed: an unauthenticated POST added to `UNAUTHENTICATED_PATHS`
 * but not here is rejected with `MissingCSRFSecretError` — loud and caught in
 * tests — rather than quietly exempted.
 */
export const CSRF_EXEMPT_UNSAFE_REQUESTS: ReadonlySet<string> = new Set([
  'POST /support/request',
  'POST /support/upload',
])

/** `upstreamPath` bound to this proxy's prefix, kept for the tests' table cases. */
export function upstreamPath(url: string): string {
  return stripPrefix(url, PROXY_PREFIX)
}

/**
 * Registers the DUOS API proxy. Handed to `fastify.register()` (never wrapped
 * in `fastify-plugin`) so the shared machinery's parser and error-handler
 * overrides stay encapsulated in this scope — see upstreamProxy.ts.
 */
export async function apiProxy(app: FastifyInstance, options: ApiProxyOptions = {}): Promise<void> {
  await registerUpstreamProxy(app, {
    prefix: PROXY_PREFIX,
    upstreamEnvVar: 'DUOS_API_URL',
    logTag: 'proxy',
    unauthenticatedPaths: UNAUTHENTICATED_PATHS,
    csrfExemptUnsafeRequests: CSRF_EXEMPT_UNSAFE_REQUESTS,
    // The DUOS API validates the same B2C access token the BFF refreshes, so
    // its 401 on a token-carrying request means the session is unusable.
    destroySessionOnUpstream401: true,
  }, options)
}
