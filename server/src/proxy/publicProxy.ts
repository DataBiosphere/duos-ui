import type { IncomingHttpHeaders } from 'node:http'
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RawServerBase,
  RequestGenericInterface,
  RouteGenericInterface,
} from 'fastify'
import type { RateLimitOptions } from '@fastify/rate-limit'
import fastifyReplyFrom from '@fastify/reply-from'
import type { FastifyReplyFromResponse } from '@fastify/reply-from'
import { logAuthEvent } from '../auth/authEvents.js'
import { rateLimitKey } from '../security/rateLimit.js'
import { upstreamBase, upstreamPath } from './upstreamProxy.js'
import { CONSENT_PROXY_SECRET_ENV_VAR, SIGNED_CLIENT_IP_HEADERS, consentProxySecretFromEnv, signClientIp } from './clientIpSignature.js'

/**
 * Public feature flags, anonymous metrics and showcase catalog lookups, independent of session infrastructure.
 * Keep credential stripping local: sharing the session proxy's header helpers
 * could introduce token injection here. Only URL helpers are shared.
 * CSRF and Fetch Metadata guards are omitted because no session authority is
 * used upstream. See ADR-013 for the CSP scope and accepted banner-bucket gap.
 */

/** `GET /public/features` and `/public/features/:key` → `${DUOS_API_URL}/feature[/:key]`. */
export const PUBLIC_FEATURES_PREFIX = '/public/features'

/** `POST /public/metrics/event` → `${DUOS_BARD_URL}/api/event`. */
export const PUBLIC_METRICS_EVENT_PATH = '/public/metrics/event'

/** `POST /public/showcase/datasets` → `${DUOS_SHOWCASE_API_URL}/showcase/datasets`. */
export const PUBLIC_SHOWCASE_DATASETS_PATH = '/public/showcase/datasets'

/** Bound anonymous JSON requests while allowing room for event properties. */
export const METRICS_BODY_LIMIT = 8 * 1024

/** Consent enforces the same limit at its boundary (DT-4275). */
export const SHOWCASE_BODY_LIMIT = 64 * 1024

const RATE_LIMIT_WINDOW_MS = 60_000

export const FEATURES_MAX_PER_WINDOW = 60

export const METRICS_MAX_PER_WINDOW = 120

/** Matches Consent's default `rateLimit.showcase.requestsPerMinute`. */
export const SHOWCASE_MAX_PER_WINDOW = 120

/** Each upstream gets its own connection pool, in addition to the session proxies. */
const PUBLIC_POOL_CONNECTIONS = 32

// Prevent upstream content from executing on the SPA origin.
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

/** Match reply-from hooks, which use the http/http2 server union. */
type ProxyRequest = FastifyRequest<RequestGenericInterface, RawServerBase>
type ProxyReply = FastifyReply<RouteGenericInterface, RawServerBase>

/** request.ips is closest-first; X-Forwarded-For is original-client-first. */
function forwardedFor(request: ProxyRequest, inbound: string | string[] | undefined): string {
  if (request.ips) {
    return [...request.ips].reverse().join(', ')
  }
  const chain = Array.isArray(inbound) ? inbound.join(', ') : inbound
  return chain ? `${chain}, ${request.ip}` : request.ip
}

/**
 * Strip credentials without mutating headers that reply-from may reuse on retry.
 * Also strip the signed client IP headers: only the showcase route sets them.
 */
function rewriteRequestHeaders(request: ProxyRequest, headers: IncomingHttpHeaders): IncomingHttpHeaders {
  const { cookie, authorization, 'x-csrf-token': csrfToken, ...rest } = headers
  const forwarded = Object.fromEntries(Object.entries(rest).filter(([name]) => !SIGNED_CLIENT_IP_HEADERS.includes(name)))
  return {
    ...forwarded,
    // Override any caller-supplied app ID.
    'x-app-id': 'DUOS',
    'x-forwarded-for': forwardedFor(request, forwarded['x-forwarded-for']),
  }
}

/** Prevent upstream responses from changing BFF-origin state or prompting for credentials. */
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

/** Map transport failures to gateway errors rather than internal-server errors. */
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
function carriesNoBody(res: FastifyReplyFromResponse, headers: IncomingHttpHeaders): boolean {
  return res.statusCode === 204 || res.statusCode === 304 || headers['content-length'] === '0'
}

/** Require a JSON content type for bodies; preserve explicitly bodiless responses. */
function enforceJsonResponse(request: ProxyRequest, reply: ProxyReply, res: FastifyReplyFromResponse): void {
  const headers = res.headers
  if (carriesNoBody(res, headers) || isJsonContentType(headers['content-type'])) {
    reply.send(res.stream)
    return
  }

  request.log.warn(
    { statusCode: res.statusCode, contentType: headers['content-type'] },
    '[public-proxy] the upstream answered with a non-JSON body — returning 502 rather than streaming it onto this origin',
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
      // The thrown object must retain its status for the local error handler.
      errorResponseBuilder: (_request, context) => ({ statusCode: context.statusCode }),
    },
  }
}

/** Separate scopes give Consent and Bard their own reply.from binding. */
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

  // Preserve raw path encoding; reply.from restores the original query string.
  app.get(`${PUBLIC_FEATURES_PREFIX}/:key`, routeOptions, (request, reply) => {
    reply.from(`/feature${upstreamPath(request.url, PUBLIC_FEATURES_PREFIX)}`, fromOptions)
  })
}

async function anonymousMetricsRoute(app: FastifyInstance): Promise<void> {
  await app.register(fastifyReplyFrom, {
    base: upstreamBase('DUOS_BARD_URL'),
    undici: { connections: PUBLIC_POOL_CONNECTIONS },
  })

  const routeOptions = {
    bodyLimit: METRICS_BODY_LIMIT,
    config: rateLimitConfig(METRICS_MAX_PER_WINDOW),
  }

  // Expose only the anonymous event route.
  app.post(PUBLIC_METRICS_EVENT_PATH, routeOptions, (request, reply) => {
    reply.from('/api/event', {
      body: request.body as string,
      contentType: request.headers['content-type'],
      rewriteRequestHeaders,
      rewriteHeaders: rewriteResponseHeaders,
      onError: onUpstreamTransportError,
    })
  })
}

/**
 * Showcase catalog lookups. A dedicated upstream lets content previews read
 * production while the authenticated API stays on its own environment.
 */
async function showcaseLookupRoute(app: FastifyInstance): Promise<void> {
  const proxySecret = consentProxySecretFromEnv()
  if (!proxySecret) {
    app.log.warn(`[server] ${CONSENT_PROXY_SECRET_ENV_VAR} is not set — showcase lookups go to Consent without a signed client IP, so all of them share one Consent rate-limit bucket`)
  }

  await app.register(fastifyReplyFrom, {
    base: upstreamBase('DUOS_SHOWCASE_API_URL'),
    undici: { connections: PUBLIC_POOL_CONNECTIONS },
  })

  const routeOptions = {
    bodyLimit: SHOWCASE_BODY_LIMIT,
    config: rateLimitConfig(SHOWCASE_MAX_PER_WINDOW),
  }

  app.post(PUBLIC_SHOWCASE_DATASETS_PATH, routeOptions, (request, reply) => {
    // Consent keys its limit on the signed IP; see clientIpSignature.ts.
    const signed = proxySecret ? signClientIp(proxySecret, rateLimitKey(request), Date.now() / 1000) : {}
    reply.from('/showcase/datasets', {
      body: request.body as string,
      contentType: request.headers['content-type'],
      // The upstream path is fixed; a caller's query string is not forwarded.
      queryString: () => '',
      rewriteRequestHeaders: (proxyRequest, headers) => ({ ...rewriteRequestHeaders(proxyRequest, headers), ...signed }),
      rewriteHeaders: rewriteResponseHeaders,
      onResponse: enforceJsonResponse,
      onError: onUpstreamTransportError,
    })
  })
}

/**
 * Bare bodies, like the session proxies' error shape under ADR-010: a parser
 * or rate-limit error message can carry framework detail, and no client reads
 * it. Logging still happens here, because this handler replaces the app-level
 * handleServerError for the whole /public scope.
 */
function handlePublicError(error: FastifyError, request: FastifyRequest, reply: FastifyReply): FastifyReply {
  const statusCode = error.statusCode ?? 500
  if (statusCode === 429) {
    request.log.warn({ ip: rateLimitKey(request), url: request.url }, '[public-proxy] rate limit exceeded')
  }
  else if (statusCode >= 500) {
    request.log.error({ err: error }, '[public-proxy] unhandled error')
  }
  return reply.status(statusCode).send()
}

/** Accept only well-formed JSON, but keep the raw string so the proxy forwards the client's bytes. */
function parseJsonBody(
  _request: FastifyRequest,
  body: string | Buffer,
  done: (err: Error | null, body?: string) => void,
): void {
  const raw = body.toString()
  try {
    JSON.parse(raw)
    done(null, raw)
  }
  catch {
    const invalid = new Error('invalid JSON body') as Error & { statusCode?: number }
    invalid.statusCode = 400
    done(invalid)
  }
}

/** The `public.completed` route label: an allowlist, never the URL. */
function routeLabel(url: string): string {
  if (url.startsWith(PUBLIC_FEATURES_PREFIX)) return 'features'
  if (url === PUBLIC_SHOWCASE_DATASETS_PATH) return 'showcase_datasets'
  return 'metrics_event'
}

/**
 * A route that answers for an upstream nobody configured.
 */
function registerUnconfiguredUpstream(app: FastifyInstance, envVar: string, routes: UnconfiguredRoute[], feature: string): void {
  app.log.warn(`[server] ${envVar} is not set — ${routes.map(route => route.url).join(' and ')} answer 503, so ${feature} will fail in this environment`)
  for (const { method, url } of routes) {
    app.route({ method, url, handler: (_request, reply) => reply.status(503).send({ error: 'upstream_not_configured' }) })
  }
}

type UnconfiguredRoute = { method: 'GET' | 'POST', url: string }

/** Register an upstream's routes, or 503 stand-ins when its env var is unset. */
async function registerUpstream(
  app: FastifyInstance,
  envVar: string,
  routes: (app: FastifyInstance) => Promise<void>,
  fallbackRoutes: UnconfiguredRoute[],
  feature: string,
): Promise<void> {
  if (process.env[envVar]) {
    await app.register(routes)
  }
  else {
    registerUnconfiguredUpstream(app, envVar, fallbackRoutes, feature)
  }
}

/**
 * Keep this plugin encapsulated so its parsers do not affect other routes.
 */
export async function publicProxy(app: FastifyInstance): Promise<void> {
  if (!app.hasDecorator('rateLimit')) {
    throw new Error(`the ${PUBLIC_FEATURES_PREFIX}, ${PUBLIC_METRICS_EVENT_PATH} and ${PUBLIC_SHOWCASE_DATASETS_PATH} routes require @fastify/rate-limit to be registered first — their per-route limits do nothing without it`)
  }

  app.setErrorHandler(handlePublicError)

  app.removeAllContentTypeParsers()
  app.addContentTypeParser('application/json', { parseAs: 'string' }, parseJsonBody)

  app.addHook('onSend', (_request, reply, _payload, done) => {
    reply.headers(RESPONSE_HARDENING)
    done()
  })

  // `public.completed`: one info line per public request, unsampled, so 6-G can
  // divide failures by it. Labels are an allowlist: no URL, no key, no body.
  // These routes carry no session, so `idp` is always `unknown`.
  app.addHook('onResponse', (request, reply, done) => {
    const url = request.routeOptions?.url
    if (url) {
      logAuthEvent(request, 'public.completed', { route: routeLabel(url), status: reply.statusCode, idp: 'unknown' })
    }
    done()
  })

  await registerUpstream(app, 'DUOS_API_URL', featureFlagRoutes, [
    { method: 'GET', url: PUBLIC_FEATURES_PREFIX },
    { method: 'GET', url: `${PUBLIC_FEATURES_PREFIX}/:key` },
  ], 'pre-login feature flags')
  await registerUpstream(app, 'DUOS_BARD_URL', anonymousMetricsRoute, [{ method: 'POST', url: PUBLIC_METRICS_EVENT_PATH }], 'anonymous usage metrics')
  // Never falls back to DUOS_API_URL: a preview must not silently read another environment.
  await registerUpstream(app, 'DUOS_SHOWCASE_API_URL', showcaseLookupRoute, [{ method: 'POST', url: PUBLIC_SHOWCASE_DATASETS_PATH }], 'showcase catalog lookups')
}
