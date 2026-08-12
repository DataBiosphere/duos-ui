import type { FastifyInstance } from 'fastify'
import {
  registerUpstreamProxy,
  upstreamPath as stripPrefix,
  type UpstreamProxyOptions,
} from './upstreamProxy.js'

/**
 * The ECM proxy (story 3-I).
 *
 * RAS / eRA Commons account linking calls ECM (Terra's External Credentials
 * Manager, "externalcreds") from the client: `AuthenticateNIH.ts` fetches the
 * provider authorization URL and exchanges the OAuth callback code. The legacy
 * client authenticated those calls itself; with browser-held tokens gone
 * (Phase 4), they must come through the BFF like every other authenticated
 * call, or linking breaks. Same machinery, same rules as the DUOS API proxy —
 * see upstreamProxy.ts — with three upstream-specific differences:
 *
 *   - **No unauthenticated paths.** Both ECM calls are made signed-in; nothing
 *     under this prefix proxies without a session.
 *   - **No CSRF exemptions.** Both calls are POSTs from an authenticated
 *     client, which can and must present an `X-CSRF-Token`.
 *   - **An upstream 401 does NOT end the session.** The DUOS API validates the
 *     same B2C access token the BFF refreshes, so its 401 is authoritative
 *     about the session. ECM authenticates on its own terms (via Sam), so its
 *     401 can mean a token-audience mismatch or an ECM-side account problem —
 *     signing the user out of DUOS over that would turn a broken linking flow
 *     into a broken everything. The 401 passes through (response-hardened,
 *     `www-authenticate` stripped) for the linking UI to surface.
 *
 * Token audience: the legacy client sent `profile.idp_access_token` — the
 * Google access token B2C copies into its claims — to ECM, falling back to the
 * B2C `id_token`. The BFF session holds neither; it injects the B2C *access*
 * token, the same credential the DUOS API accepts. That is expected to work:
 * ECM validates no JWTs itself — its httpd-terra-proxy sidecar does, and that
 * proxy's audience allowlist explicitly names DUOS's B2C app registrations
 * (terra-helmfile `global.proxyOauthAllowList.b2c_additional_audiences`) —
 * then resolves the user by handing the same bearer to Sam, whose identical
 * proxy DUOS tokens already pass on every Consent request. The full chain and
 * the live dev probe are recorded in the story
 * (BFF_Epics/epic-3-v2-api-proxy.md § 3-I); if that probe ever fails, the fix
 * belongs in the auth callback (persist `idp_access_token`), not here.
 */

/**
 * The BFF-side prefix. `/ecm-api/api/oauth/v1/ras/authorization-url` →
 * `${DUOS_ECM_URL}/api/oauth/v1/ras/authorization-url`. The client leg lands
 * with the Phase 4 refactor: `getECMUrl()` returns this in BFF environments,
 * so the two call sites keep their literal paths.
 */
export const ECM_PROXY_PREFIX = '/ecm-api'

const NO_PATHS: ReadonlySet<string> = new Set()

/** `upstreamPath` bound to this proxy's prefix, kept for the tests' table cases. */
export function ecmUpstreamPath(url: string): string {
  return stripPrefix(url, ECM_PROXY_PREFIX)
}

/**
 * Registers the ECM proxy. Handed to `fastify.register()` (never wrapped in
 * `fastify-plugin`) so the shared machinery's parser and error-handler
 * overrides stay encapsulated in this scope — see upstreamProxy.ts.
 */
export async function ecmProxy(app: FastifyInstance, options: UpstreamProxyOptions = {}): Promise<void> {
  await registerUpstreamProxy(app, {
    prefix: ECM_PROXY_PREFIX,
    upstreamEnvVar: 'DUOS_ECM_URL',
    logTag: 'ecm-proxy',
    unauthenticatedPaths: NO_PATHS,
    csrfExemptUnsafeRequests: NO_PATHS,
    destroySessionOnUpstream401: false,
  }, options)
}
