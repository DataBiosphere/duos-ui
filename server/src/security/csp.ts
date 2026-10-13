import { CSP_REPORT_GROUP, CSP_REPORT_PATH } from './cspReport.js'

// CSP derived from the runtime config served to the client. See ADR-013.

// Feature flags and metrics are same-origin in BFF mode. Only the banner
// bucket named by bannersUrl stays direct; connectSources adds it below.
const BFF_CONNECT_FIELDS: readonly string[] = []

// Legacy mode calls all upstreams directly. B2C is navigated to, not fetched.
const LEGACY_CONNECT_FIELDS = ['apiUrl', 'bardApiUrl', 'ecmApiUrl', 'tdrApiUrl'] as const

export interface CspEnvironment {
  isDev: boolean
  reportOnly: boolean
}

/** Return a configured absolute URL's origin. */
function configuredOrigin(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    const { origin } = new URL(value)
    // Do not emit the ambiguous CSP source "null" for opaque origins.
    return origin === 'null' ? undefined : origin
  }
  catch {
    return undefined
  }
}

/**
 * Return the banner feed's bucket as a path-scoped source. The GCS origin is
 * shared by every public bucket, so the origin alone would allowlist all of them.
 */
export function bannerSource(bannersUrl: unknown): string | undefined {
  if (typeof bannersUrl !== 'string' || bannersUrl.trim() === '') return undefined
  try {
    const bucket = new URL('.', bannersUrl)
    return bucket.origin === 'null' ? undefined : bucket.href
  }
  catch {
    return undefined
  }
}

export function connectSources(config: Record<string, unknown>, env: CspEnvironment): string[] {
  const fields = config.bffEnabled === true ? BFF_CONNECT_FIELDS : LEGACY_CONNECT_FIELDS
  const sources = new Set<string>(['\'self\''])
  for (const field of fields) {
    const origin = configuredOrigin(config[field])
    if (origin) sources.add(origin)
  }
  const banner = bannerSource(config.bannersUrl)
  if (banner) {
    sources.add(banner)
  }
  if (env.isDev) {
    // Explicit schemes cover Vite HMR across browsers.
    sources.add('ws:')
    sources.add('wss:')
  }
  return [...sources]
}

export function contentSecurityPolicyOptions(config: Record<string, unknown>, env: CspEnvironment) {
  const scriptSrc = ['\'self\'']
  if (env.isDev) {
    // Vite injects the inline React Fast Refresh preamble in development.
    scriptSrc.push('\'unsafe-inline\'')
  }

  const directives: Record<string, string[]> = {
    defaultSrc: ['\'self\''],
    scriptSrc,
    scriptSrcAttr: ['\'none\''],
    // React style props require inline style attributes.
    styleSrc: ['\'self\'', '\'unsafe-inline\''],
    // Bundled SVGs contain data images; no live image flow uses blob URLs.
    imgSrc: ['\'self\'', 'data:'],
    frameSrc: ['\'self\''],
    connectSrc: connectSources(config, env),
    fontSrc: ['\'self\''],
    objectSrc: ['\'none\''],
    baseUri: ['\'none\''],
    frameAncestors: ['\'none\''],
    formAction: ['\'self\''],
    manifestSrc: ['\'self\''],
    reportUri: [CSP_REPORT_PATH],
    reportTo: [CSP_REPORT_GROUP],
  }

  // Do not rewrite requests when using the HTTP development server.
  if (!env.isDev) {
    directives.upgradeInsecureRequests = []
  }

  return { useDefaults: false as const, directives, reportOnly: env.reportOnly }
}
