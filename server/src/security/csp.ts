import type { FastifyHelmetOptions } from '@fastify/helmet'

/**
 * CSP sources come from browser-reachable runtime config fields. BFF mode
 * omits services reached through same-origin proxies. See ADR-013 for the
 * source inventory.
 */

/** Keep this path-scoped: storage.googleapis.com is shared by public buckets. */
export const BANNER_SOURCE = 'https://storage.googleapis.com/broad-duos-banners/'

export const CSP_REPORT_PATH = '/csp-report'

export const CSP_REPORT_GROUP = 'csp-endpoint'

// Feature flags and anonymous metrics remain browser-direct in BFF mode.
const BFF_CONNECT_FIELDS = ['apiUrl', 'bardApiUrl'] as const

/**
 * B2C is absent because legacy OIDC gets metadata from Consent and reaches B2C
 * only by navigation. Revisit this list if that flow starts fetching B2C.
 */
const LEGACY_CONNECT_FIELDS = ['apiUrl', 'bardApiUrl', 'ecmApiUrl', 'tdrApiUrl'] as const

export interface CspEnvironment {
  isDev: boolean
  reportOnly: boolean
}

/** Returns the origin of a nonblank absolute URL. */
function configuredOrigin(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    const { origin } = new URL(value)
    // The CSP source "null" would match any opaque origin.
    return origin === 'null' ? undefined : origin
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
  sources.add(BANNER_SOURCE)
  if (env.isDev) {
    // Some browsers do not apply 'self' to Vite's HMR websocket.
    sources.add('ws:')
    sources.add('wss:')
  }
  return [...sources]
}

/** Helmet's defaults allow all HTTPS styles and always upgrade HTTP requests. */
export function contentSecurityPolicyOptions(config: Record<string, unknown>, env: CspEnvironment) {
  const scriptSrc = ['\'self\'']
  if (env.isDev) {
    // Vite injects the React Fast Refresh bootstrap inline in development.
    scriptSrc.push('\'unsafe-inline\'')
  }

  const directives: Record<string, string[]> = {
    defaultSrc: ['\'self\''],
    scriptSrc,
    // React uses DOM listeners; inline event-handler attributes stay disabled.
    scriptSrcAttr: ['\'none\''],
    // React style props require inline style attributes.
    styleSrc: ['\'self\'', '\'unsafe-inline\''],
    // Bundled SVGs contain data URIs; current blob URLs are downloads, not images.
    imgSrc: ['\'self\'', 'data:'],
    // Add blob: if DocumentUpload's iframe preview is restored.
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

  // Do not rewrite requests from the plain-HTTP development server to HTTPS.
  if (!env.isDev) {
    directives.upgradeInsecureRequests = []
  }

  return { useDefaults: false as const, directives, reportOnly: env.reportOnly }
}

export function helmetOptions(config: Record<string, unknown>, env: CspEnvironment): FastifyHelmetOptions {
  return {
    contentSecurityPolicy: contentSecurityPolicyOptions(config, env),
    // Legacy OIDC returns through a popup whose postMessage requires
    // window.opener; COOP severs it after B2C redirects back. BFF uses a
    // top-level redirect and can retain isolation.
    crossOriginOpenerPolicy: config.bffEnabled === true
      ? { policy: 'same-origin-allow-popups' }
      : false,
    // Cross-origin app resources do not all send the headers COEP requires.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    // Retain legacy protection alongside frame-ancestors.
    xFrameOptions: { action: 'deny' },
    // Do not pin plain-HTTP development to HTTPS.
    strictTransportSecurity: env.isDev
      ? false
      : { maxAge: 31536000, includeSubDomains: true, preload: false },
  }
}
