import { BlockList, isIP } from 'node:net'
import { normalizeIP, type RateLimitOptions, type RateLimitPluginOptions } from '@fastify/rate-limit'
import type { FastifyRequest } from 'fastify'

/**
 * Rate limiting for the auth endpoints (Phase 5, stories 5-G2 and 5-G3).
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
 * | `GET /auth/callback` | yes   | Callback flood control only — generous on purpose         |
 * | `/auth/csrf-token` | no      | The authentication gate (5-B) is the control; a low cap breaks multiple tabs and the client's retry path |
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
 * ## Why the defaults are not the lower numbers first proposed
 *
 * Many users share one institutional NAT egress IP, so a per-IP bucket is
 * really a per-org bucket. The defaults start deliberately generous and
 * are meant to be tightened from measured traffic — which is why they are
 * environment-overridable (see below) rather than fixed in code: tightening
 * is then a deployment config change, not a code release.
 *
 * ## Keying
 *
 * The key is the client address from `rateLimitKey` below, not `request.ip`.
 * Deployed, `request.ip` is a Google front-end address (35.191.x.x), so it
 * names the same few buckets for every user. On dev on 2026-10-28 the load
 * balancer logged the real client, but the sidecar and `request.ip` both saw
 * only the front end (DT-4374).
 *
 * The GKE ingress `BackendConfig` in terra-helmfile (`charts/ingress`) sets
 * `X-Real-IP:{client_ip_address}`. The load balancer overwrites a client
 * header with the same name, and the httpd-terra-proxy sidecar passes it on.
 * On dev, a spoofed `X-Real-IP` sent to Consent's showcase limiter (DT-4280)
 * was logged as the real client address. The rules:
 *
 *   - **The header counts only when the socket peer is loopback**, which is
 *     the sidecar in the same pod. A pod that reaches the app port directly
 *     has a `10.x` peer, so its `X-Real-IP` is ignored. The header must also
 *     hold exactly one IP literal; Node joins a repeated header with `, `.
 *     Loopback is not proof that the load balancer set the header: the
 *     sidecar does not touch `X-Real-IP`, so a pod that calls the sidecar's
 *     own port passes its chosen value through. Consent's `ClientIpResolver`
 *     has the same gap. Only callers outside the cluster are covered.
 *   - **Otherwise the key is `request.ip`.** That keeps local dev and
 *     docker-compose (no `X-Real-IP`) working as before. `request.ip` honors
 *     `X-Forwarded-For` because `TRUST_PROXY` (config.ts) names the trusted
 *     peers. `TRUST_PROXY` trusts `uniquelocal`, so a caller whose own address
 *     is RFC1918 (a pod past the sidecar) can still send a fresh
 *     `X-Forwarded-For` per request and spend an unlimited number of buckets.
 *     That is a property of `TRUST_PROXY` (which also governs
 *     `X-Forwarded-Proto`) rather than of this module, and it is another
 *     reason the edge is the real control.
 *   - Only the `gke` ingress class renders that `BackendConfig`. Behind
 *     another ingress, such as the HAProxy ingress in BEEs, nothing
 *     overwrites a client-supplied `X-Real-IP`.
 *
 * IPv6 keys are grouped to a /64 — the standard single-customer delegation —
 * so one client cannot spend 2^64 buckets. The plugin does this only for its
 * default key, so `rateLimitKey` calls the plugin's `normalizeIP` itself.
 */

export const RATE_LIMIT_ERROR_CODE = 'rate_limited'
const REAL_IP_HEADER = 'x-real-ip'
const IPV4_MAPPED_PREFIX = '::ffff:'
const RATE_LIMIT_ERROR_MARKER = 'DUOS_RATE_LIMITED'

/** Names the tuning knobs so tests and docs cannot drift from the reads below. */
export const LOGIN_MAX_ENV_VAR = 'DUOS_RATE_LIMIT_LOGIN_MAX'
export const CALLBACK_MAX_ENV_VAR = 'DUOS_RATE_LIMIT_CALLBACK_MAX'
export const TEST_SIGNIN_MAX_ENV_VAR = 'DUOS_RATE_LIMIT_TEST_SIGNIN_MAX'

const DEFAULT_LOGIN_MAX = 30
const DEFAULT_CALLBACK_MAX = 60
const DEFAULT_TEST_SIGNIN_MAX = 300
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

const LOOPBACK = new BlockList()
LOOPBACK.addSubnet('127.0.0.0', 8, 'ipv4')
LOOPBACK.addAddress('::1', 'ipv6')

function isLoopback(address: string | undefined): boolean {
  if (!address) return false
  const unmapped = address.startsWith(IPV4_MAPPED_PREFIX) ? address.slice(IPV4_MAPPED_PREFIX.length) : address
  if (isIP(unmapped) === 4) return LOOPBACK.check(unmapped, 'ipv4')
  return isIP(address) === 6 && LOOPBACK.check(address, 'ipv6')
}

/** One IP literal without a zone, or undefined. See "Keying" above. */
function realIpHeader(request: FastifyRequest): string | undefined {
  const value = request.headers[REAL_IP_HEADER]
  if (typeof value !== 'string') return undefined
  const literal = value.trim()
  return isIP(literal) !== 0 && !literal.includes('%') ? literal : undefined
}

/** The rate-limit key for every limited route. See "Keying" above. */
export function rateLimitKey(request: FastifyRequest): string {
  const realIp = isLoopback(request.socket.remoteAddress) ? realIpHeader(request) : undefined
  return normalizeIP(realIp ?? request.ip)
}

export const rateLimitPluginOptions = {
  global: false,
  // Route `config.rateLimit` objects inherit this: the plugin merges the
  // plugin options under each route's own.
  keyGenerator: rateLimitKey,
  errorResponseBuilder: (_request, context) => Object.assign(
    new Error(`Rate limit exceeded, retry in ${context.after}`),
    { statusCode: context.statusCode, code: RATE_LIMIT_ERROR_MARKER },
  ),
  // NOTE: a `cache` set here would be silently ignored. The plugin reads
  // `cache` for the parent store only, and a route that carries its own
  // `config.rateLimit` gets a child store built from the *merged route*
  // params, which never inherit it. To size the LRU, put `cache` in the
  // objects the two functions below return.
} as const satisfies RateLimitPluginOptions

export function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && (err as { code?: string }).code === RATE_LIMIT_ERROR_MARKER
}

export function loginRateLimit(): RateLimitOptions {
  return { max: maxFromEnv(LOGIN_MAX_ENV_VAR, DEFAULT_LOGIN_MAX), timeWindow: TIME_WINDOW }
}

/** Route `config.rateLimit` for `GET /auth/callback`. */
export function callbackRateLimit(): RateLimitOptions {
  return { max: maxFromEnv(CALLBACK_MAX_ENV_VAR, DEFAULT_CALLBACK_MAX), timeWindow: TIME_WINDOW }
}

export function testSigninRateLimit(): RateLimitOptions {
  return { max: maxFromEnv(TEST_SIGNIN_MAX_ENV_VAR, DEFAULT_TEST_SIGNIN_MAX), timeWindow: TIME_WINDOW }
}
