import type { FastifyHelmetOptions } from '@fastify/helmet'
import { type CspEnvironment, contentSecurityPolicyOptions } from './csp.js'

/** Security headers chosen for DUOS's legacy and BFF flows. See ADR-013. */

export function helmetOptions(
  config: Record<string, unknown>,
  env: CspEnvironment & { hsts?: boolean },
): FastifyHelmetOptions {
  return {
    contentSecurityPolicy: contentSecurityPolicyOptions(config, env),
    // Any COOP value severs the legacy B2C popup's window.opener on return.
    // BFF sign-in uses a top-level redirect and can retain opener isolation.
    crossOriginOpenerPolicy: config.bffEnabled === true
      ? { policy: 'same-origin-allow-popups' }
      : false,
    // Direct banner, feature-flag, and metrics responses do not provide CORP.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    xFrameOptions: { action: 'deny' },
    // Avoid pinning a developer's browser to HTTPS. `hsts` overrides the
    // inference for the E2E harness, which runs the production build on the
    // hostname a developer browses.
    strictTransportSecurity: (env.hsts ?? !env.isDev)
      ? { maxAge: 31536000, includeSubDomains: true, preload: false }
      : false,
  }
}
