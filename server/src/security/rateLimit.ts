import type { RateLimitOptions, RateLimitPluginOptions } from '@fastify/rate-limit'

/**
 * Rate limiting for the auth endpoints.
 *
 * **This is a backstop, not the primary control.** The default
 * `@fastify/rate-limit` store is per-process: in a multi-pod deployment the
 * effective limit multiplies by the replica count and resets on every
 * restart. Production flood protection belongs at the ingress/edge (or a
 * shared store); the limits here are a floor against a flood from one source,
 * not against a distributed one. The edge work is infrastructure and is
 * tracked as its own task.
 *
 * ## Why `global: false`
 *
 * The same Fastify instance serves every SPA asset through `@fastify/vite`,
 * and one page load fetches many of them. A low global cap would 429 an
 * ordinary page load, so the plugin is registered with `global: false` and
 * each auth route opts in through its own route `config.rateLimit`.
 *
 * ## What is limited, and what is not
 *
 * | Route              | Limited | Why                                                       |
 * |--------------------|---------|-----------------------------------------------------------|
 * | `POST /auth/login` | yes     | Session-row creation and OIDC discovery flood control     |
 * | `GET /auth/callback` | not yet | Story DT-4022 (5-G3). It is a top-level navigation from B2C, so a 429 needs to land the user back in the SPA rather than send a JSON body — a separate change with its own client half |
 * | `/auth/csrf-token` | no      | The authentication gate is the control; a low cap breaks multiple tabs and the client's retry path |
 * | `/auth/logout`     | no      | Already gated by the CSRF guard                           |
 * | SPA assets         | no      | See `global: false` above                                 |
 * | `POST /duos-api/support/request`, `POST /duos-api/support/upload` | **no — open gap** | See below |
 *
 * `/auth/login` verifies no credentials itself — it mints PKCE state, writes
 * an anonymous session row, and returns a B2C redirect URL. Its limit
 * protects against session-row creation floods, **not** password guessing;
 * that happens at B2C. With `global: false` the plugin attaches a *route*
 * `onRequest` hook, which Fastify runs after the instance-level hooks — so a
 * flood carrying a session cookie still costs one session-store read per
 * request. Row *creation* is still prevented, because `@fastify/session` only
 * writes on modification.
 *
 * The two `/duos-api/support/*` writes are the one unlimited path that needs
 * no session and no CSRF token (`proxy/apiProxy.ts`, `UNAUTHENTICATED_PATHS`
 * and `CSRF_EXEMPT_UNSAFE_REQUESTS`). They relay the signed-out Contact Us
 * form and its file upload to the upstream, so a flood there reaches the
 * support inbox and pushes attacker-chosen bytes through the BFF — a better
 * target than `/auth/login`, whose flood only mints session rows. Limiting a
 * proxied path is a separate decision (which paths, what limits, and how a
 * 429 fits the proxy's own error shape under ADR-010), so it is named here
 * rather than silently omitted, and left to its own story.
 *
 * ## Why the default is not the lower number first proposed
 *
 * Many users share one institutional NAT egress IP, so a per-IP bucket is
 * really a per-org bucket. The default starts deliberately generous and is
 * meant to be tightened from measured traffic — which is why it is
 * environment-overridable (see below) rather than fixed in code: tightening
 * is then a deployment config change, not a code release.
 *
 * ## Keying
 *
 * The plugin keys on `request.ip`, which honors `X-Forwarded-For` because
 * `TRUST_PROXY` (config.ts) names the trusted peers. `proxy-addr` walks the
 * chain from the socket end and stops at the first address that is **not** a
 * trusted peer, and that address becomes `request.ip`. Two consequences:
 *
 *   - **From outside the trusted ranges an attacker cannot choose a bucket**,
 *     as long as the sidecar itself sets or appends `X-Forwarded-For`: the
 *     real client address it adds sits to the right of anything the attacker
 *     supplied, so the walk stops there first. A sidecar that instead passes
 *     a client-supplied header through untouched (httpd's `ProxyAddHeaders
 *     Off`, or any proxy that does not manage the header) breaks this — so
 *     the sidecar's `X-Forwarded-For` mode still has to be confirmed at the
 *     edge. `mod_proxy` appends by default.
 *   - **From inside the trusted ranges an attacker can choose a bucket.**
 *     `TRUST_PROXY` trusts `uniquelocal`, so for a caller whose own address
 *     is RFC1918 the walk continues *past* the appended real client and into
 *     attacker-supplied entries. k8s pod addresses are `10.x` and the server
 *     binds `0.0.0.0`, so a pod that reaches the app port directly, past the
 *     same-pod sidecar, can send a fresh `X-Forwarded-For` per request and
 *     spend an unlimited number of buckets. That is a property of
 *     `TRUST_PROXY` (which also governs `X-Forwarded-Proto`) rather than of
 *     this module, and it is another reason the edge is the real control.
 *
 * IPv6 keys are grouped to a /64 — the standard single-customer delegation —
 * so one client cannot spend 2^64 buckets.
 */

export const RATE_LIMIT_ERROR_CODE = 'rate_limited'
const RATE_LIMIT_ERROR_MARKER = 'DUOS_RATE_LIMITED'

/** Names the tuning knob so tests and docs cannot drift from the read below. */
export const LOGIN_MAX_ENV_VAR = 'DUOS_RATE_LIMIT_LOGIN_MAX'

const DEFAULT_LOGIN_MAX = 30
const TIME_WINDOW = '1 minute'

/**
 * A blank or unset value means "use the default"
 */
function maxFromEnv(envVar: string, defaultMax: number): number {
  const raw = process.env[envVar]?.trim()
  if (!raw) return defaultMax

  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new Error(`${envVar} is set to '${raw}', which is not a positive whole number — unset it to use the default of ${defaultMax}, or set a plain count of requests per minute`)
  }
  return Number(raw)
}

export const rateLimitPluginOptions = {
  global: false,
  errorResponseBuilder: (_request, context) => Object.assign(
    new Error(`Rate limit exceeded, retry in ${context.after}`),
    { statusCode: context.statusCode, code: RATE_LIMIT_ERROR_MARKER },
  ),
} as const satisfies RateLimitPluginOptions

export function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && (err as { code?: string }).code === RATE_LIMIT_ERROR_MARKER
}

export function loginRateLimit(): RateLimitOptions {
  return { max: maxFromEnv(LOGIN_MAX_ENV_VAR, DEFAULT_LOGIN_MAX), timeWindow: TIME_WINDOW }
}
