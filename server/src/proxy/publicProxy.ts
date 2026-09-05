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
 * Public feature flags and anonymous metrics, independent of session infrastructure.
 * Keep credential stripping local: sharing the session proxy's header helpers
 * could introduce token injection here. Only URL helpers are shared.
 * CSRF and Fetch Metadata guards are omitted because no session authority is
 * used upstream. See ADR-013 for the CSP scope and accepted banner-bucket gap.
 */

/** `GET /public/features` and `/public/features/:key` → `${DUOS_API_URL}/feature[/:key]`. */
export const PUBLIC_FEATURES_PREFIX = '/public/features'

/** `POST /public/metrics/event` → `${DUOS_BARD_URL}/api/event`. */
export const PUBLIC_METRICS_EVENT_PATH = '/public/metrics/event'

/** Bound anonymous JSON requests while allowing room for event properties. */
export const METRICS_BODY_LIMIT = 8 * 1024

const RATE_LIMIT_WINDOW_MS = 60_000

export const FEATURES_MAX_PER_WINDOW = 60

export const METRICS_MAX_PER_WINDOW = 120

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

// reply-from types this as a ServerResponse even though the stream is incoming.
type UpstreamResponse = RawReplyDefaultExpression<RawServerBase> & { stream: IncomingMessage }

function upstreamHeaders(res: UpstreamResponse): IncomingHttpHeaders {
  return (res as unknown as { headers: IncomingHttpHeaders }).headers
}

/** request.ips is closest-first; X-Forwarded-For is original-client-first. */
function forwardedFor(request: ProxyRequest, inbound: string | string[] | undefined): string {
  if (request.ips) {
    return [...request.ips].reverse().join(', ')
  }
  const chain = Array.isArray(inbound) ? inbound.join(', ') : inbound
  return chain ? `${chain}, ${request.ip}` : request.ip
}

/** Strip credentials without mutating headers that reply-from may reuse on retry. */
function rewriteRequestHeaders(request: ProxyRequest, headers: IncomingHttpHeaders): IncomingHttpHeaders {
  const { cookie, authorization, 'x-csrf-token': csrfToken, ...forwarded } = headers
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
function carriesNoBody(res: UpstreamResponse, headers: IncomingHttpHeaders): boolean {
  return res.statusCode === 204 || res.statusCode === 304 || headers['content-length'] === '0'
}

/** Require a JSON content type for bodies; preserve explicitly bodiless responses. */
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
  app.post(PUBLIC_METRICS_EVENT_PATH, routeOptions, (_request, reply) => {
    reply.from('/api/event', {
      rewriteRequestHeaders,
      rewriteHeaders: rewriteResponseHeaders,
      onError: onUpstreamTransportError,
    })
  })
}

/**
 * Keep this plugin encapsulated so its parsers do not affect other routes.
 * Missing upstreams disable their routes; malformed configured origins fail startup.
 */
export async function publicProxy(app: FastifyInstance): Promise<void> {
  // Return bare statuses for parser and rate-limit errors.
  app.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) =>
    reply.status(error.statusCode ?? 500).send())

  // Buffer JSON to enforce the body limit; reply-from serializes the parsed body.
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
