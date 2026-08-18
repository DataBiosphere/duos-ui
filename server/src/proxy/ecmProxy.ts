import type { FastifyInstance } from 'fastify'
import {
  registerUpstreamProxy,
  upstreamPath as stripPrefix,
  type UpstreamProxyOptions,
} from './upstreamProxy.js'

/**
 * The ECM proxy.
 *
 * RAS / eRA Commons account linking calls ECM (Terra's External Credentials
 * Manager, "externalcreds") from the client: `AuthenticateNIH.ts` fetches the
 * provider authorization URL and exchanges the OAuth callback code. Same rules
 * as the DUOS API proxy — see upstreamProxy.ts — with three upstream-specific
 * differences:
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
 */
export const ECM_PROXY_PREFIX = '/ecm-api'

const NO_PATHS: ReadonlySet<string> = new Set()

/** `upstreamPath` bound to this proxy's prefix, kept for the tests' table cases. */
export function ecmUpstreamPath(url: string): string {
  return stripPrefix(url, ECM_PROXY_PREFIX)
}

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
