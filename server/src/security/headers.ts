import type { FastifyHelmetOptions } from '@fastify/helmet'
import { type CspEnvironment, contentSecurityPolicyOptions } from './csp.js'

/**
 * The server's security response headers, via `@fastify/helmet`.
 *
 * Helmet's own defaults are the risk here, not the headers this app wants —
 * two of them break flows DUOS still depends on. Each is set deliberately
 * below. The policy itself lives in csp.ts, derived from runtime config.
 *
 * See docs/plans/bff_adrs/ADR-013-content-security-policy.md.
 */

export function helmetOptions(
  config: Record<string, unknown>,
  env: CspEnvironment,
): FastifyHelmetOptions {
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
    // No report-only mode exists for COOP — it is not part of the CSP — so
    // getting it wrong breaks sign-in on the first deploy, in every
    // environment, since none has bffEnabled on yet. Legacy deployments get no
    // COOP at all until Epic 6 retires that flow. BFF sign-in is a top-level
    // redirect with no popup and no opener, so it keeps the isolation.
    crossOriginOpenerPolicy: config.bffEnabled === true
      ? { policy: 'same-origin-allow-popups' }
      : false,
    // COEP demands CORP or CORS headers on every cross-origin subresource.
    // The banner bucket and the feature-flag/metrics upstreams send neither,
    // so enabling it would block them. Off until those are same-origin.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    // Belt and braces with `frame-ancestors 'none'` in the policy, for
    // anything that reads only the legacy header. The deployed httpd sidecar
    // sets this too; ours is what a local or compose run gets.
    xFrameOptions: { action: 'deny' },
    // Gated on NODE_ENV, not on the transport, so that `pnpm start:server`
    // cannot pin a developer's browser to https for a year. A compose stack
    // runs as production and does send it; browsers ignore HSTS delivered over
    // plain HTTP, so that costs nothing there.
    strictTransportSecurity: env.isDev
      ? false
      : { maxAge: 31536000, includeSubDomains: true, preload: false },
  }
}
