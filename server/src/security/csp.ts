import { CSP_REPORT_GROUP, CSP_REPORT_PATH } from './cspReport.js'

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
 * deployment-configured upstream, so it is the one literal source here.
 *
 * Scoped to the bucket's path, not just the origin: `storage.googleapis.com`
 * is shared by every public bucket on GCS, so allowing the bare origin would
 * leave injected script a ready exfiltration target — the precise thing this
 * policy exists to close. CSP source expressions take a path, and a trailing
 * slash matches by prefix, which covers every `<env>_notifications.json` the
 * service builds.
 *
 * One limit worth knowing: a browser drops the path when matching the target
 * of a redirect, so this narrows the direct request only. GCS answers object
 * reads without redirecting, so that costs nothing here.
 *
 * The configured upstreams below stay at origin granularity on purpose. Each
 * is a whole service the app talks to across many paths, and unlike this
 * bucket none of them shares a host with anybody else.
 */
export const BANNER_SOURCE = 'https://storage.googleapis.com/broad-duos-banners/'

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

/**
 * Legacy mode calls all four upstreams directly from the browser.
 *
 * B2C is absent from this list too, and that is load-bearing rather than an
 * oversight. The authority URL is not a config.json field at all — it arrives
 * in Consent's /oauth2/configuration response — so if the browser ever
 * *fetched* B2C there would be nothing here to derive an entry from.
 *
 * It never does. `oidcBroker.ts` passes oidc-client-ts an explicit `metadata`
 * object, which short-circuits discovery; JWKS, userinfo, and the session
 * monitor are all dead in this configuration; and silent renew falls back to a
 * refresh-token POST to `token_endpoint`, which is the apiUrl origin. The
 * popup reaches B2C by navigation, which no directive here governs.
 *
 * Four edits in that file would each break sign-in with no config field to
 * repair it from: dropping the `metadata` override, `loadUserInfo: true`,
 * `monitorSession: true`, or a real `redirect_uri`/`silent_redirect_uri` (the
 * last needs `frame-src` too). See ADR-013 for the audit.
 */
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
  sources.add(BANNER_SOURCE)
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
    //
    // Deliberately not `blob:`. The audit found no `<img src="blob:">` in the
    // tree: every object URL the app mints is a download (`<a download>` in
    // utils.ts, FileDownload.ts, EditDac.tsx) or the dead preview branch in
    // DocumentUpload.tsx, and a download navigation needs no directive. The
    // story says to add it only once a report-only run proves the need, and
    // report-only is exactly what makes that cheap to find out.
    //
    // Deliberately not `https:`, which would trust every origin on the web.
    imgSrc: ['\'self\'', 'data:'],
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
