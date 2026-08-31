import type { FastifyHelmetOptions } from '@fastify/helmet'

/**
 * Content Security Policy for the SPA and the BFF, derived from the same
 * runtime `config.json` the client reads.
 *
 * Two rules shape this file:
 *
 *  1. **Nothing is hardcoded except `'self'` and the banner bucket.** Every
 *     other origin comes from an inventoried, *active* field of config.json.
 *     The development config also carries convenience origins the browser
 *     never connects to; sweeping up every URL-shaped value would allowlist
 *     them by accident.
 *  2. **The allowlist is mode-specific.** Under `bffEnabled`, ECM and TDR are
 *     reached through same-origin proxies, so their origins must NOT appear.
 *     Legacy deployments still call them directly and must keep them until
 *     Epic 6 retires the legacy client.
 *
 * See docs/plans/bff_adrs/ADR-013-content-security-policy.md for the audit
 * that produced the inventory, and for the follow-up that collapses BFF-mode
 * `connect-src` to `'self'`.
 */

/**
 * Banner notifications are read straight from a public GCS bucket
 * (`src/libs/notificationService.ts`). It is a fixed public asset host, not a
 * deployment-configured upstream, so it is the one literal origin here.
 */
export const BANNER_ORIGIN = 'https://storage.googleapis.com'

/** Where the browser posts violation reports. See security/cspReport.ts. */
export const CSP_REPORT_PATH = '/csp-report'

/** The `report-to` group name, paired with the `Reporting-Endpoints` header. */
export const CSP_REPORT_GROUP = 'csp-endpoint'

/**
 * config.json fields that name an origin the *browser* connects to.
 *
 * BFF mode keeps only the two flows that stay direct after cutover:
 *   - `apiUrl` — unauthenticated feature flags (`/feature`, `/feature/:key`),
 *     consulted pre-login, so the session-guarded proxy would 401 them.
 *   - `bardApiUrl` — anonymous metrics, which deliberately carry no
 *     credentials; identified events go through the /bard-api proxy.
 * `ecmApiUrl` and `tdrApiUrl` are absent on purpose: those calls are proxied.
 */
const BFF_CONNECT_FIELDS = ['apiUrl', 'bardApiUrl'] as const

/** Legacy mode calls all four upstreams directly from the browser. */
const LEGACY_CONNECT_FIELDS = ['apiUrl', 'bardApiUrl', 'ecmApiUrl', 'tdrApiUrl'] as const

export interface CspEnvironment {
  /** `NODE_ENV !== 'production'`: Vite dev allowances on, HSTS off. */
  isDev: boolean
  /** Send `Content-Security-Policy-Report-Only` instead of the enforcing header. */
  reportOnly: boolean
}

/**
 * The origin of a configured URL, or undefined when the field is absent,
 * blank, or not a parseable absolute URL — base_config.json ships every field
 * as `""`, so a blank must drop out rather than become a directive entry.
 */
function configuredOrigin(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    const { origin } = new URL(value)
    // Opaque origins serialise to the literal "null", which as a CSP source
    // would allow *any* opaque origin. Drop it.
    return origin === 'null' ? undefined : origin
  }
  catch {
    return undefined
  }
}

/**
 * The `connect-src` allowlist for this deployment.
 *
 * Exported so tests (and the ADR) can assert the mode split directly rather
 * than parsing it back out of a header string.
 */
export function connectSources(config: Record<string, unknown>, env: CspEnvironment): string[] {
  const fields = config.bffEnabled === true ? BFF_CONNECT_FIELDS : LEGACY_CONNECT_FIELDS
  const sources = new Set<string>(['\'self\''])
  for (const field of fields) {
    const origin = configuredOrigin(config[field])
    if (origin) sources.add(origin)
  }
  sources.add(BANNER_ORIGIN)
  if (env.isDev) {
    // Vite's HMR client opens a websocket back to the dev server. `'self'`
    // covers ws/wss on the same origin under CSP3, but not every browser
    // implements that fallback, and the dev server may be reached over a
    // different scheme than the page.
    sources.add('ws:')
    sources.add('wss:')
  }
  return [...sources]
}

/**
 * The CSP directives, as helmet options.
 *
 * `useDefaults: false` — every directive below is stated outright. Helmet's
 * defaults include `style-src https:` and an unconditional
 * `upgrade-insecure-requests`, neither of which this app wants.
 */
export function contentSecurityPolicyOptions(config: Record<string, unknown>, env: CspEnvironment) {
  const scriptSrc = ['\'self\'']
  if (env.isDev) {
    // Vite's dev server rewrites index.html to add the React Fast Refresh
    // preamble as an *inline* module script. Production builds emit only
    // hashed files under /assets, so this allowance is dev-only. The root
    // index.html carries no inline script or style of its own — audited for
    // this story — so nothing else needs a hash or a nonce.
    scriptSrc.push('\'unsafe-inline\'')
  }

  const directives: Record<string, string[]> = {
    defaultSrc: ['\'self\''],
    scriptSrc,
    // Blocks `onclick="…"`-style handlers outright. React attaches listeners
    // through the DOM, so nothing in the tree needs them.
    scriptSrcAttr: ['\'none\''],
    // The component tree styles almost everything through React `style={{…}}`
    // props, which are inline style attributes. `style-src-attr` falls back to
    // this directive, so dropping 'unsafe-inline' would blank the whole app.
    styleSrc: ['\'self\'', '\'unsafe-inline\''],
    // `data:` — bundled SVGs embed raster fallbacks as data URIs.
    // `blob:` — object URLs the app mints for uploads and downloads. No live
    // `<img src="blob:">` was found in the audit, but blob: images are a
    // routine React pattern and such a URL can only be created by same-origin
    // script, so the allowance is kept rather than risk an unexamined path.
    // Deliberately not `https:`, which would trust every origin on the web.
    imgSrc: ['\'self\'', 'data:', 'blob:'],
    // The app frames nothing today. `openPreviewWindow` in
    // components/forms/DocumentUpload.tsx looks like it frames a blob: object
    // URL, but it opens the window with `noopener`, and `window.open` returns
    // null for that by specification — so it always takes the download
    // fallback and the iframe is never created. Repairing that preview means
    // adding `blob:` back here.
    frameSrc: ['\'self\''],
    connectSrc: connectSources(config, env),
    // The Roboto and Montserrat faces are vendored under public/css.
    fontSrc: ['\'self\''],
    objectSrc: ['\'none\''],
    baseUri: ['\'none\''],
    frameAncestors: ['\'none\''],
    formAction: ['\'self\''],
    manifestSrc: ['\'self\''],
    reportUri: [CSP_REPORT_PATH],
    reportTo: [CSP_REPORT_GROUP],
  }

  // Gated on NODE_ENV, which is what `isDev` reads — not on the transport.
  // That keeps `pnpm start:server` working, where this directive would rewrite
  // every request to https. Note it does NOT spare docker-compose:
  // docker-compose.yaml defaults NODE_ENV to production, so a compose stack
  // reached over plain HTTP on :80 gets its subresources upgraded and lands on
  // the :443 mapping instead. Use the https port there.
  if (!env.isDev) {
    directives.upgradeInsecureRequests = []
  }

  return { useDefaults: false as const, directives, reportOnly: env.reportOnly }
}

/**
 * The full helmet configuration, CSP included.
 *
 * The non-CSP headers need as much care as the policy itself — helmet's
 * defaults break two flows this app still depends on.
 */
export function helmetOptions(config: Record<string, unknown>, env: CspEnvironment): FastifyHelmetOptions {
  return {
    contentSecurityPolicy: contentSecurityPolicyOptions(config, env),
    // COOP is OFF in legacy mode, and `same-origin-allow-popups` is not a
    // safe middle ground there — this was measured, not assumed.
    //
    // The legacy sign-in flow opens a popup, sends it to B2C, and B2C
    // redirects it back to `${origin}/redirect-from-oauth`, where
    // oidc-client-ts posts the result to `window.opener`
    // (src/libs/auth/oidcBroker.ts, src/index.tsx). `-allow-popups` only
    // spares a popup on its *initial* navigation, and only while the popup's
    // own document is `unsafe-none`. The return leg is a different comparison:
    // the popup's current document is B2C (`unsafe-none`) and the incoming one
    // is ours (COOP set), which is a mismatch — so the browser swaps browsing
    // context groups and `window.opener` becomes null. `postMessage` then
    // throws, the opener never hears back, and `signinPopup()` never resolves.
    //
    // Nothing about this is covered by DUOS_CSP_REPORT_ONLY: COOP is not part
    // of the CSP and has no report-only mode. Getting it wrong breaks sign-in
    // on the first deploy, so legacy deployments get no COOP at all until
    // Epic 6 retires that flow. BFF sign-in is a top-level redirect with no
    // popup and no opener, so it keeps the isolation.
    crossOriginOpenerPolicy: config.bffEnabled === true
      ? { policy: 'same-origin-allow-popups' }
      : false,
    // COEP demands CORP or CORS headers on every cross-origin subresource.
    // The banner bucket and the feature-flag/metrics upstreams send neither,
    // so enabling it would block them. Off until those are same-origin.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    // Belt and braces with `frame-ancestors 'none'`, for anything that reads
    // only the legacy header.
    xFrameOptions: { action: 'deny' },
    // Gated on NODE_ENV, like upgrade-insecure-requests above, so that
    // `pnpm start:server` cannot pin a developer's browser to https for a
    // year. A compose stack runs as production and does send it; browsers
    // ignore HSTS delivered over plain HTTP, so that costs nothing there.
    strictTransportSecurity: env.isDev
      ? false
      : { maxAge: 31536000, includeSubDomains: true, preload: false },
  }
}
