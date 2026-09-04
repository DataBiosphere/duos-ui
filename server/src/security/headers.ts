import type { FastifyHelmetOptions } from '@fastify/helmet'

/**
 * The server's security response headers, via `@fastify/helmet`.
 * See docs/plans/bff_adrs/ADR-013-content-security-policy.md.
 */

export interface SecurityHeaderEnvironment {
  isDev: boolean
}

export function helmetOptions(
  config: Record<string, unknown>,
  env: SecurityHeaderEnvironment,
): FastifyHelmetOptions {
  return {
    // CSP is provided by the Terra proxy. This config flips when CSP is moved into the app.
    contentSecurityPolicy: false,
    // COOP-related configurations are only needed when the BFF is enabled.
    crossOriginOpenerPolicy: config.bffEnabled === true
      ? { policy: 'same-origin-allow-popups' }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    xFrameOptions: { action: 'deny' },
    strictTransportSecurity: env.isDev
      ? false
      : { maxAge: 31536000, includeSubDomains: true, preload: false },
  }
}
