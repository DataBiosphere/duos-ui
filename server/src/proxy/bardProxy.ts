import type { FastifyInstance } from 'fastify'
import {
  registerUpstreamProxy,
  upstreamPath as stripPrefix,
  type UpstreamProxyOptions,
} from './upstreamProxy.js'

/**
 * The Bard proxy.
 *
 * Bard (Terra's Mixpanel gateway) is how DUOS reports usage metrics:
 * `Metrics.ts` POSTs `/api/event`, `/api/identify`, and `/api/syncProfile`.
 * The signed-in legs require a bearer token Bard-side, which the browser no
 * longer holds under the BFF — without this route, the Phase 4 client had to
 * downgrade `captureEvent` to anonymous-only and leave `identify`/
 * `syncProfile` as inert no-ops. Proxying restores identified metrics: the
 * signed-in client calls these paths through /bard-api and the session token
 * is injected here.
 *
 * Anonymous events are NOT this proxy's concern: a signed-out `captureEvent`
 * never carried a token, so the client keeps sending it directly to Bard
 * (`bardApiUrl` in config.json), exactly as the legacy client does. That is
 * why the configuration matches ECM/TDR instead of growing an unauthenticated
 * allowlist:
 *   - **No unauthenticated paths.** Everything routed here is signed-in; the
 *     signed-out traffic never arrives. A sessionless POST through this
 *     prefix is a client bug, and 401s loudly rather than proxying an
 *     anonymous event.
 *   - **No CSRF exemptions.** All three calls are POSTs from an
 *     authenticated client, which can and must present an `X-CSRF-Token`.
 *   - **An upstream 401 does NOT end the session.** Bard is a Terra service
 *     authenticating on its own terms (via Sam), so its 401 is not
 *     authoritative about the BFF session; it passes through
 *     (response-hardened, `www-authenticate` stripped). The client treats
 *     metrics as best-effort, but the pass-through keeps a misconfigured
 *     Bard visible in the network tab and the BFF logs rather than silent.
 */
export const BARD_PROXY_PREFIX = '/bard-api'

const NO_PATHS: ReadonlySet<string> = new Set()

/** `upstreamPath` bound to this proxy's prefix, kept for the tests' table cases. */
export function bardUpstreamPath(url: string): string {
  return stripPrefix(url, BARD_PROXY_PREFIX)
}

export async function bardProxy(app: FastifyInstance, options: UpstreamProxyOptions = {}): Promise<void> {
  await registerUpstreamProxy(app, {
    prefix: BARD_PROXY_PREFIX,
    upstreamEnvVar: 'DUOS_BARD_URL',
    logTag: 'bard-proxy',
    unauthenticatedPaths: NO_PATHS,
    csrfExemptUnsafeRequests: NO_PATHS,
    destroySessionOnUpstream401: false,
  }, options)
}
