import type { IncomingHttpHeaders, IncomingMessage } from 'node:http'
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawServerBase,
  RequestGenericInterface,
  RouteGenericInterface,
} from 'fastify'
import type { RateLimitOptions } from '@fastify/rate-limit'
import fastifyReplyFrom from '@fastify/reply-from'
import { upstreamBase, upstreamPath } from './upstreamProxy.js'

/**
 * The public BFF endpoints (Phase 5, story 5-F6).
 *
 * Three browser flows carried no credentials before the cutover and still carry
 * none after it: the unauthenticated feature flags, read pre-login, and the
 * anonymous Bard event. Under `bffEnabled` they were the last two reasons
 * `connect-src` had to name the Consent and Bard origins at all. Moving them
 * onto same-origin endpoints is what lets BFF-mode `connect-src` collapse to
 * `'self'` plus the banner bucket (security/csp.ts).
 *
 * **This module deliberately does not use `registerUpstreamProxy`.** Two
 * reasons, and the second is the important one:
 *
 *   - That helper throws unless `@fastify/csrf-protection` is already
 *     registered, and index.ts registers that plugin only inside the
 *     `DUOS_DB_HOST` block. These routes register outside both switches,
 *     because they serve pre-login traffic and must not depend on the session
 *     infrastructure being configured at all.
 *   - Its entire purpose is attaching the session's B2C access token. The point
 *     of this module is that omitting the token is *structural* rather than
 *     configured: there is no allowlist to fall off, no `unauthenticatedPaths`
 *     set to drift, and no shared code path that a future edit to the proxy
 *     machinery could make start injecting one here. **Nothing below reads
 *     `request.session`**, not even defensively — the absence of the reference
 *     is the guarantee.
 *
 * What is shared with upstreamProxy.ts is pure URL plumbing — `upstreamBase`
 * for the startup validation of an upstream origin, `upstreamPath` for slicing
 * a prefix off a raw URL. Neither knows what a session is. The request- and
 * response-leg hygiene below is deliberately a local copy of what
 * `rewriteRequestHeaders`/`rewriteHeaders` do there rather than an import: it is
 * the behavior this file exists to guarantee, and a public endpoint should not
 * change what it forwards because the session-carrying proxy was edited.
 *
 * **No CSRF, and no Fetch Metadata guard**, both on purpose:
 *
 *   - CSRF cannot apply. A CSRF token protects a request that borrows the
 *     browser's ambient authority; these requests carry no cookie upstream and
 *     no token is injected, so a forged one reaches the upstream with exactly
 *     the authority anybody already has by calling it directly. There is
 *     nothing to forge with. Requiring a token would also make the endpoints
 *     unreachable pre-login, which is the case they exist for.
 *   - The Fetch Metadata guard (security/fetchMetadata.ts) exists to stop a
 *     cross-site request from reaching a state-changing endpoint while carrying
 *     the session cookie. These carry none, so it buys nothing here and would
 *     only risk rejecting a legitimate call shape — the metrics event is
 *     best-effort and fired from contexts whose `Sec-Fetch-*` values are not
 *     worth betting the endpoint on.
 *
 * What bounds them instead, since anyone on the internet can reach both: a
 * per-route rate limit, a body limit on the POST, response validation on the
 * feature flags, and the same response hardening every proxied response gets.
 */

/** `GET /public/features` and `/public/features/:key` → `${DUOS_API_URL}/feature[/:key]`. */
export const PUBLIC_FEATURES_PREFIX = '/public/features'

/** `POST /public/metrics/event` → `${DUOS_BARD_URL}/api/event`. */
export const PUBLIC_METRICS_EVENT_PATH = '/public/metrics/event'

/**
 * The Bard event body: `{ event, properties }`, where properties are the call
 * site's details plus a dozen short strings from `getDefaultProperties()` and
 * the page's hostname and path. The largest event DUOS sends is well under
 * 2 KB. 8 KB leaves several times that in headroom while keeping an
 * unauthenticated POST from pushing an arbitrary payload at Bard, and matches
 * the cap the other public endpoint (the CSP report sink) already uses.
 */
export const METRICS_BODY_LIMIT = 8 * 1024

const RATE_LIMIT_WINDOW_MS = 60_000

/**
 * A page load consults a handful of flags at most, and the client memoises the
 * one flag it reads (`getFlagNhgriDacId`), so a genuine browser never comes
 * close. Sixty a minute per client leaves room for a tab reloading repeatedly.
 */
export const FEATURES_MAX_PER_WINDOW = 60

/**
 * Above the feature-flag limit because a signed-out user browsing generates
 * several events a minute legitimately — a search, a page view, a filter — and
 * a dropped metric is invisible to the user, so the limit must not bite first.
 * It still bounds what one client can push into Bard through this origin.
 */
export const METRICS_MAX_PER_WINDOW = 120

/**
 * Smaller than the session proxies' pool (128): each reply-from registration
 * builds its own undici Agent, so this is an additional per-origin socket
 * allowance on the same pod, and these two endpoints carry a fraction of the
 * traffic the DUOS API proxy does.
 */
const PUBLIC_POOL_CONNECTIONS = 32

// Identical to upstreamProxy.ts's: a response served from the SPA's origin must
// not execute there. Kept local — see the module comment on why this file does
// not import the proxy machinery's copy.
const RESPONSE_HARDENING: Readonly<IncomingHttpHeaders> = {
  'x-content-type-options': 'nosniff',
  'content-security-policy': 'sandbox',
}

// These describe the upstream hop, not the browser connection (RFC 9110 §7.6.1).
const CONNECTION_SPECIFIC_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'upgrade',
])

/**
 * `reply.from`'s hooks are typed against `RawServerBase` — the http/http2 union
 * — rather than this app's concrete server, so the callbacks below have to be
 * too, or they are rejected as contravariantly incompatible.
 */
type ProxyRequest = FastifyRequest<RequestGenericInterface, RawServerBase>
type ProxyReply = FastifyReply<RouteGenericInterface, RawServerBase>

// reply-from types this as a ServerResponse even though the stream is incoming.
type UpstreamResponse = RawReplyDefaultExpression<RawServerBase> & { stream: IncomingMessage }

function upstreamHeaders(res: UpstreamResponse): IncomingHttpHeaders {
  return (res as unknown as { headers: IncomingHttpHeaders }).headers
}

/**
 * The client-to-upstream address chain, with this pod appended as a hop —
 * `request.ips` is ordered closest-first, so it reverses into the header's
 * original-client-first order. Only populated when `trustProxy` is set, which
 * index.ts always does; the fallback keeps this correct for an app that
 * registers these routes without it.
 */
function forwardedFor(request: ProxyRequest, inbound: string | string[] | undefined): string {
  if (request.ips) {
    return [...request.ips].reverse().join(', ')
  }
  const chain = Array.isArray(inbound) ? inbound.join(', ') : inbound
  return chain ? `${chain}, ${request.ip}` : request.ip
}

/**
 * The headers the upstream actually sees.
 *
 * Runs after `reply.from` has copied the request headers, set `host` to the
 * upstream and stripped the hop-by-hop ones, so this deals only with what is
 * specific to the BFF. Omitted by destructuring rather than deleted, because
 * `headers` is the object reply-from reuses across a retry.
 *
 *   cookie        — the session cookie is the BFF's credential. These endpoints
 *                   never read it, and it must not leak to an upstream that has
 *                   no use for it either.
 *   authorization — never trust a client-supplied bearer token. Note what is
 *                   *not* here: no replacement is put back. That omission is
 *                   the whole story, so it is spelled out rather than left to
 *                   be inferred from the absence of a line.
 *   x-csrf-token  — meaningless upstream, and these routes enforce no CSRF.
 */
function rewriteRequestHeaders(request: ProxyRequest, headers: IncomingHttpHeaders): IncomingHttpHeaders {
  const { cookie, authorization, 'x-csrf-token': csrfToken, ...forwarded } = headers
  return {
    ...forwarded,
    // Sent by the client on every call today (Config.authOpts), so both
    // upstreams already expect it. Injected rather than merely forwarded so it
    // is true of every request regardless of what the caller set.
    'x-app-id': 'DUOS',
    'x-forwarded-for': forwardedFor(request, forwarded['x-forwarded-for']),
  }
}

/**
 * The headers the browser sees. The rule is the same as the session proxies':
 * a response served from this origin is applied as though the BFF had sent it,
 * so the upstream may not write to this origin's state.
 *
 *   set-cookie      — would land on the BFF origin and could overwrite
 *                     `sessionId`, handing the user a different session or a
 *                     broken one. An unauthenticated endpoint is the last place
 *                     that should be reachable: nothing about the request
 *                     proves the caller is anyone.
 *   clear-site-data — clears cookies, storage and cache for the BFF origin,
 *                     which would sign the user out and wipe local state.
 *   www-authenticate — a challenge for a scheme this origin does not use; a
 *                     `Basic` one would pop a native credential dialog on it.
 */
function rewriteResponseHeaders(headers: IncomingHttpHeaders): IncomingHttpHeaders {
  const {
    'set-cookie': setCookie,
    'clear-site-data': clearSiteData,
    'www-authenticate': wwwAuthenticate,
    ...forwarded
  } = headers
  return Object.fromEntries(
    Object.entries(forwarded).filter(([name]) => !CONNECTION_SPECIFIC_RESPONSE_HEADERS.has(name)),
  )
}

/**
 * Normalises the "never reached the upstream" failures to 502, as
 * upstreamProxy.ts does: reply-from leaves `ECONNREFUSED`, `ECONNRESET` and the
 * undici socket errors at 500, which this scope's error handler would then
 * answer as a bare 500 — indistinguishable from a bug in the BFF itself.
 */
function onUpstreamTransportError(reply: ProxyReply, { error }: { error: Error }): void {
  const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 502
  const isGatewayClass = statusCode >= 502 && statusCode <= 504
  reply.status(isGatewayClass ? statusCode : 502).send({ error: 'upstream_unavailable' })
}

/** `application/json` and the `+json` structured-suffix types, ignoring parameters. */
function isJsonContentType(contentType: string | string[] | undefined): boolean {
  if (typeof contentType !== 'string') return false
  const mediaType = contentType.split(';')[0].trim().toLowerCase()
  return mediaType === 'application/json' || mediaType.endsWith('+json')
}

/** A response with nothing to validate: no body is defined, or none was sent. */
function carriesNoBody(res: UpstreamResponse, headers: IncomingHttpHeaders): boolean {
  return res.statusCode === 204 || res.statusCode === 304 || headers['content-length'] === '0'
}

/**
 * Feature flags pass through only as JSON.
 *
 * `getAllFeatureFlags` and `getFeatureFlag` parse JSON and nothing else, so a
 * non-JSON body is already a broken upstream — but streaming one would put an
 * arbitrary upstream-chosen body on this origin at an unauthenticated URL, which
 * is worth refusing outright rather than relying on the `sandbox` hardening
 * downstream of it. A bodiless response (a 204, or a 404 an upstream answers
 * with no content) is passed through: there is nothing to sniff, and turning a
 * legitimate 404 into a 502 would misreport a missing flag as an outage.
 */
function enforceJsonResponse(request: ProxyRequest, reply: ProxyReply, res: UpstreamResponse): void {
  const headers = upstreamHeaders(res)
  if (carriesNoBody(res, headers) || isJsonContentType(headers['content-type'])) {
    reply.send(res.stream)
    return
  }

  request.log.warn(
    { statusCode: res.statusCode, contentType: headers['content-type'] },
    '[public-proxy] the feature-flag upstream answered with a non-JSON body — returning 502 rather than streaming it onto this origin',
  )

  // Drain the replaced response so undici can reuse its socket.
  res.stream.on('error', (err: Error) => {
    request.log.debug({ err }, '[public-proxy] discarded non-JSON upstream body errored')
  })
  res.stream.resume()

  // Remove metadata for the discarded body; preserve reply-from's connection header.
  for (const name of Object.keys(headers)) {
    if (name !== 'connection') {
      reply.removeHeader(name)
    }
  }

  reply.status(502).send({ error: 'upstream_not_json' })
}

function rateLimitConfig(max: number): { rateLimit: RateLimitOptions } {
  return {
    rateLimit: {
      max,
      timeWindow: RATE_LIMIT_WINDOW_MS,
      // The plugin *throws* whatever this returns, so it has to carry the
      // status or the scope's error handler answers 500. The body is dropped
      // for the same reason the handler's is: the default builder names the
      // plugin and echoes the retry window back to whoever is probing for it.
      errorResponseBuilder: (_request, context) => ({ statusCode: context.statusCode }),
    },
  }
}

/**
 * The feature-flag reads. Registered in their own child scope so this pair gets
 * its own `reply.from` bound to the DUOS API, independent of the metrics scope's
 * — one `decorateReply('from')` per scope. The hooks, parsers and error handler
 * declared by the parent apply here unchanged.
 */
async function featureFlagRoutes(app: FastifyInstance): Promise<void> {
  await app.register(fastifyReplyFrom, {
    base: upstreamBase('DUOS_API_URL'),
    undici: { connections: PUBLIC_POOL_CONNECTIONS },
  })

  const fromOptions = {
    rewriteRequestHeaders,
    rewriteHeaders: rewriteResponseHeaders,
    onResponse: enforceJsonResponse,
    onError: onUpstreamTransportError,
  }

  const routeOptions = { config: rateLimitConfig(FEATURES_MAX_PER_WINDOW) }

  app.get(PUBLIC_FEATURES_PREFIX, routeOptions, (_request, reply) => {
    reply.from('/feature', fromOptions)
  })

  // The upstream path is sliced off the raw URL rather than rebuilt from
  // `request.params.key`: Fastify percent-decodes a param, and re-encoding it
  // would have to reproduce the client's encoding byte-for-byte to address the
  // same upstream resource. reply.from re-appends the original query itself.
  app.get(`${PUBLIC_FEATURES_PREFIX}/:key`, routeOptions, (request, reply) => {
    reply.from(`/feature${upstreamPath(request.url, PUBLIC_FEATURES_PREFIX)}`, fromOptions)
  })
}

/**
 * The anonymous Bard event. Its own child scope, for the same reason as above:
 * a second `reply.from`, bound to Bard.
 */
async function anonymousMetricsRoute(app: FastifyInstance): Promise<void> {
  await app.register(fastifyReplyFrom, {
    base: upstreamBase('DUOS_BARD_URL'),
    undici: { connections: PUBLIC_POOL_CONNECTIONS },
  })

  const routeOptions = {
    bodyLimit: METRICS_BODY_LIMIT,
    config: rateLimitConfig(METRICS_MAX_PER_WINDOW),
  }

  // One fixed upstream path, not a wildcard: the endpoint exists for exactly
  // the one call `Metrics.captureEvent` makes when signed out. Everything else
  // Bard exposes stays behind the session-carrying /bard-api proxy.
  app.post(PUBLIC_METRICS_EVENT_PATH, routeOptions, (_request, reply) => {
    reply.from('/api/event', {
      rewriteRequestHeaders,
      rewriteHeaders: rewriteResponseHeaders,
      onError: onUpstreamTransportError,
    })
  })
}

/**
 * Registered as a plain (non-`fastify-plugin`) function so Fastify gives it its
 * own encapsulation context — `removeAllContentTypeParsers()` below must apply
 * to this scope alone, or the rest of the app would lose its JSON parsing too.
 *
 * Each upstream is optional and checked independently: index.ts registers this
 * outside both cutover switches, so a legacy deployment — or a local server run
 * with neither variable set — has to boot, and a missing upstream must disable
 * one endpoint rather than fail startup. A variable that *is* set but malformed
 * still fails at startup, naming itself, via `upstreamBase`.
 */
export async function publicProxy(app: FastifyInstance): Promise<void> {
  // The app-level error handler is installed in index.ts *after* this plugin is
  // registered, so Fastify never resolves it for these routes. Without one
  // here, the default serialiser answers a 413 with FST_ERR_CTP_BODY_TOO_LARGE
  // and a 415 with FST_ERR_CTP_INVALID_MEDIA_TYPE, naming the framework to an
  // unauthenticated caller where every other route generalises. Same reasoning
  // as security/cspReport.ts, which is the other endpoint in this position.
  app.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) =>
    reply.status(error.statusCode ?? 500).send())

  // Cleared, then exactly one media type re-added, so anything else is answered
  // 415 before a handler runs. The session proxies install a pass-through
  // parser instead, because DUOS uploads multipart and binary bodies that must
  // stream unread; here the opposite is wanted. Buffering and re-parsing is
  // what makes `bodyLimit` enforceable at all — an unread stream is never
  // measured against it — and it means only well-formed JSON is ever forwarded
  // to Bard. reply-from re-serialises the parsed object on the way out.
  app.removeAllContentTypeParsers()
  app.addContentTypeParser('application/json', { parseAs: 'string', bodyLimit: METRICS_BODY_LIMIT }, (_request, body, done) => {
    try {
      done(null, JSON.parse(body as string))
    }
    catch {
      const invalid = new Error('invalid JSON body') as Error & { statusCode?: number }
      invalid.statusCode = 400
      done(invalid)
    }
  })

  app.addHook('onSend', (_request, reply, _payload, done) => {
    reply.headers(RESPONSE_HARDENING)
    done()
  })

  if (process.env.DUOS_API_URL) {
    await app.register(featureFlagRoutes)
  }
  else {
    app.log.warn(`[server] DUOS_API_URL is not set — ${PUBLIC_FEATURES_PREFIX} is disabled, so pre-login feature flags will fail in this environment`)
  }

  if (process.env.DUOS_BARD_URL) {
    await app.register(anonymousMetricsRoute)
  }
  else {
    app.log.warn(`[server] DUOS_BARD_URL is not set — ${PUBLIC_METRICS_EVENT_PATH} is disabled, so anonymous usage metrics will fail in this environment`)
  }
}
