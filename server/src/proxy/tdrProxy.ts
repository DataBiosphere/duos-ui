import type { FastifyInstance } from 'fastify'
import {
  registerUpstreamProxy,
  upstreamPath as stripPrefix,
  type UpstreamProxyOptions,
} from './upstreamProxy.js'

/**
 * The TDR proxy.
 *
 * Dataset pages enumerate the Terra Data Repository snapshots linked to DUOS
 * datasets: `TerraDataRepo.listSnapshotsByDatasetIds` issues
 * `GET /api/repository/v1/snapshots?limit=1000&duosDatasetIds=…`, batched 70
 * ids per request and fired concurrently. Two properties of the shared
 * machinery matter for that shape: the query string is forwarded byte-for-byte
 * (the repeated `duosDatasetIds` params must not be re-encoded or collapsed),
 * and the bounded upstream socket pool absorbs the concurrent burst.
 *
 * Same rules as the ECM proxy, for the same reasons — see ecmProxy.ts:
 *   - **No unauthenticated paths.** Snapshot enumeration is signed-in only.
 *   - **No CSRF exemptions.** The client only GETs today; any future unsafe
 *     method must present an `X-CSRF-Token`.
 *   - **An upstream 401 does NOT end the session.** TDR is a Terra service
 *     authenticating on its own terms (via Sam), so its 401 is not
 *     authoritative about the BFF session; it passes through
 *     (response-hardened, `www-authenticate` stripped) for the dataset UI to
 *     surface as a failed enumeration.
 */
export const TDR_PROXY_PREFIX = '/tdr-api'

const NO_PATHS: ReadonlySet<string> = new Set()

/** `upstreamPath` bound to this proxy's prefix, kept for the tests' table cases. */
export function tdrUpstreamPath(url: string): string {
  return stripPrefix(url, TDR_PROXY_PREFIX)
}

/**
 * Registers the TDR proxy. Handed to `fastify.register()` (never wrapped in
 * `fastify-plugin`) so the shared machinery's parser and error-handler
 * overrides stay encapsulated in this scope — see upstreamProxy.ts.
 */
export async function tdrProxy(app: FastifyInstance, options: UpstreamProxyOptions = {}): Promise<void> {
  await registerUpstreamProxy(app, {
    prefix: TDR_PROXY_PREFIX,
    upstreamEnvVar: 'DUOS_TDR_URL',
    logTag: 'tdr-proxy',
    unauthenticatedPaths: NO_PATHS,
    csrfExemptUnsafeRequests: NO_PATHS,
    destroySessionOnUpstream401: false,
  }, options)
}
