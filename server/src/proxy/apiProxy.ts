import type { IncomingHttpHeaders } from 'node:http'
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RawServerBase,
  RequestGenericInterface,
  RouteGenericInterface,
} from 'fastify'
import fastifyReplyFrom from '@fastify/reply-from'
import { requireEnv } from '../auth/oidcClient.js'
import { RefreshFailedError, refreshAccessToken } from '../auth/refresh.js'

/**
 * The BFF API proxy (Phase 3, story 3-C).
 *
 * Every DUOS API call the client makes is forwarded from here with the session's
 * B2C access token attached, so the browser never holds a bearer token. The
 * shape of this module is set by ADR-004
 * (docs/plans/bff_adrs/ADR-004-api-proxy-layer.md), which chose
 * `@fastify/reply-from` inside a route the BFF declares itself over
 * `@fastify/http-proxy` or a hand-rolled `fetch` loop. The three things worth
 * re-reading there:
 *
 *   - **Bodies stream, unparsed.** DUOS uploads `multipart/form-data` and
 *     `application/binary` and downloads blobs. Fastify would 415 the former
 *     before this handler ran and hand the latter over pre-parsed, so this
 *     scope clears every content-type parser and installs one pass-through.
 *   - **One prefix, mapped to the upstream root.** 9 of the client's 113 upstream
 *     paths sit outside `/api` (`/status`, `/feature`, `/ontology/*`, …), so
 *     an `/api/*` wildcard under-covers. `/duos-api/<path>` covers all of them
 *     with one rule and cannot collide with the BFF's own routes.
 *   - **Five paths are called unauthenticated today.** The signed-out status
 *     page and the Contact Us form depend on it, so they proxy through with no
 *     session and no injected `Authorization`.
 *
 * Deliberately not here: CSRF enforcement on unsafe methods (story 3-D, an
 * `onRequest` hook on this route) and destroying the session when the upstream
 * itself returns 401 (story 3-E, an `onResponse` hook on `reply.from`).
 *
 * Nor is the plugin registered on the app until 3-D — and when it is, it belongs
 * inside index.ts's `if (process.env.DUOS_DB_HOST)` block, under the same
 * `bffEnabled === true` gate as the `/auth/*` routes. That is not just symmetry
 * with those routes: the fatal-refresh path below calls `reply.clearCookie`,
 * which is a `@fastify/cookie` decorator, and index.ts registers that plugin
 * only inside the DUOS_DB_HOST block. Registered outside it, a dead refresh
 * token would raise a TypeError instead of returning 401.
 */

/**
 * The BFF-side prefix. `/duos-api/api/dataset/1` → `${DUOS_API_URL}/api/dataset/1`.
 *
 * Public API surface between client and BFF: Epic 4 makes `getApiUrl()` return
 * this, at which point all 104 call sites keep their literal paths. Changing it
 * later means changing both ends together.
 */
export const PROXY_PREFIX = '/duos-api'

/**
 * How early to renew the access token. Wide enough that a request which passes
 * this check still has a usable token by the time it reaches the upstream, so
 * ordinary expiry never reaches the browser as a 401.
 */
export const REFRESH_WINDOW_SECONDS = 60

/**
 * Bounded rather than undici's unbounded default (`connections: null` lets a
 * Pool open Clients without limit): a request burst should queue on a fixed
 * socket pool instead of consuming file descriptors until the pod runs out.
 * Story 3-H load-tests the proxy and is the place to revise this. Timeouts stay
 * at undici's 5-minute defaults, which large dataset uploads and document
 * downloads need.
 */
const UPSTREAM_POOL_CONNECTIONS = 128

/**
 * Paths the client calls today with no `Authorization` header, verified against
 * the call sites rather than assumed: `/status` (ServiceStatus.ts),
 * `/oauth2/configuration` (OAuth2.ts), `/tos/text/duos` (ToS.ts, `textPlain()`),
 * `/support/request` and `/support/upload` (Support.ts).
 *
 * They proxy through without a session, and without a token even when there IS
 * a session — matching current client behaviour exactly is the point, so
 * cutover cannot change what the upstream sees. Without this allowlist the
 * signed-out status page and the Contact Us form would start returning 401.
 *
 * Matched exactly, not by prefix: a `/status` prefix would also swallow a
 * future `/statuses`, and every entry here is a fixed path.
 */
export const UNAUTHENTICATED_PATHS: ReadonlySet<string> = new Set([
  '/status',
  '/oauth2/configuration',
  '/tos/text/duos',
  '/support/request',
  '/support/upload',
])

/**
 * Strips the BFF prefix and the query string, yielding the upstream path.
 *
 * The query is dropped on purpose rather than forwarded here: `reply.from()`
 * re-appends the original query from `request.raw.url` byte-for-byte when the
 * source it is given carries none. Passing it through `new URL()` instead would
 * re-encode it, and paths like `/ontology/autocomplete?q=…` cannot afford that.
 */
export function upstreamPath(url: string): string {
  const queryIndex = url.indexOf('?')
  const path = queryIndex === -1 ? url : url.slice(0, queryIndex)
  // The `|| '/'` is defensive, not a routing case: `/duos-api/*` does not match
  // the bare prefix, so `/duos-api` 404s before reaching here and `/duos-api/`
  // already slices to '/'. It only guarantees this exported helper never hands
  // `reply.from` an empty source string.
  return path.slice(PROXY_PREFIX.length) || '/'
}

/**
 * `reply.from`'s hooks are typed against `RawServerBase` — the http/http2 union
 * — rather than this app's concrete server, so the two callbacks below have to
 * be too, or they are rejected as contravariantly incompatible. Nothing either
 * one touches differs between the two server types.
 */
type ProxyRequest = FastifyRequest<RequestGenericInterface, RawServerBase>
type ProxyReply = FastifyReply<RouteGenericInterface, RawServerBase>

/**
 * Registers the proxy. Not wrapped in `fastify-plugin` — the encapsulation is
 * the point: `removeAllContentTypeParsers()` below must apply to this scope
 * only, or `/auth/*` would lose its JSON parsing too.
 */
export async function apiProxy(app: FastifyInstance): Promise<void> {
  // Cleared wholesale, then one wildcard pass-through. A `'*'` parser alone is
  // not enough: it is only the last resort. `getParser` resolves the exact
  // content type, then the media type, then the regex list, and reaches `'*'`
  // last — so Fastify's built-in `application/json` and `text/plain` parsers
  // keep winning, and those bodies arrive buffered, capped by `bodyLimit`, and
  // pre-parsed into an object that `reply.from` would send as
  // `"[object Object]"`. DUOS posts JSON on nearly every mutation, so that is
  // the common path, not an edge case. Clearing everything (rather than
  // overriding those two) also cannot be outflanked by a parser some future
  // plugin registers in this scope.
  app.removeAllContentTypeParsers()
  app.addContentTypeParser('*', (_request, payload, done) => {
    // The payload stays an unread stream, so bodies are neither buffered in
    // memory nor measured against Fastify's 1 MB bodyLimit. `reply.from`
    // recognises a Stream body and pipes it straight to the upstream.
    done(null, payload)
  })

  await app.register(fastifyReplyFrom, {
    base: upstreamBase(),
    undici: { connections: UPSTREAM_POOL_CONNECTIONS },
  })

  app.all(`${PROXY_PREFIX}/*`, { preHandler: ensureUpstreamAuth }, (request, reply) => {
    reply.from(upstreamPath(request.url), { rewriteRequestHeaders, rewriteHeaders, onError: onUpstreamTransportError })
  })
}

/**
 * Normalises the "never reached the upstream" failures to 502.
 *
 * reply-from maps `ENOTFOUND` to 503 and its timeouts to 504, but leaves
 * `ECONNREFUSED`, `ECONNRESET`, `UND_ERR_SOCKET` and `UND_ERR_CONNECT_TIMEOUT`
 * at 500 — so the commonest way for the DUOS API to be down reaches the browser
 * as index.ts's generic "An unexpected error occurred", indistinguishable from a
 * bug in the BFF itself. Gateway-class statuses are left alone, because 503 and
 * 504 tell the client something 502 does not.
 */
function onUpstreamTransportError(reply: ProxyReply, { error }: { error: Error }): void {
  const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 502
  const isGatewayClass = statusCode >= 502 && statusCode <= 504
  reply.status(isGatewayClass ? statusCode : 502).send({ error: 'upstream_unavailable' })
}

/**
 * `DUOS_API_URL` must be an origin with no path — `reply.from` builds the
 * upstream as `new URL(source, base)`, which discards a base path and then
 * fails its own "source must be a relative path string" guard. Checked at
 * registration so a bad value fails at startup naming the variable, rather than
 * 500ing every proxied request.
 *
 * All three ways to get it wrong have to name the variable, or the guard does
 * not do the job it exists for. A missing scheme is the likeliest — a bare
 * hostname is what a Helm value tends to look like — and `new URL()` rejects it
 * with an unadorned `TypeError: Invalid URL` that mentions neither the variable
 * nor the value. The protocol check is what separates `localhost:8000`
 * (protocol `localhost:`, pathname `8000`) from a genuine path, which would
 * otherwise be reported as "has a path".
 */
function upstreamBase(): string {
  const base = requireEnv('DUOS_API_URL')
  const mustBeOrigin = 'it must be a bare origin (scheme, host, and port only), because the proxy appends the upstream path to it'

  let parsed: URL
  try {
    parsed = new URL(base)
  }
  catch {
    throw new Error(`DUOS_API_URL is '${base}', which is not a valid URL — ${mustBeOrigin}. Include the scheme, e.g. https://duos.example.org`)
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`DUOS_API_URL is '${base}', whose scheme is '${parsed.protocol}' — ${mustBeOrigin}. Expected http or https, e.g. https://duos.example.org`)
  }

  if (parsed.pathname !== '/') {
    throw new Error(`DUOS_API_URL is '${base}', which has a path — ${mustBeOrigin}`)
  }

  return base
}

/**
 * Gate and token freshness, ahead of the handler.
 *
 * Returns the reply on the failure paths: in an async hook Fastify needs the
 * reply returned to know the response was already sent, otherwise it carries on
 * to the handler.
 */
async function ensureUpstreamAuth(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | undefined> {
  if (UNAUTHENTICATED_PATHS.has(upstreamPath(request.url))) {
    return undefined
  }

  // Registered where it has to be (see the module comment), `@fastify/session`
  // is always present and `request.session` is always an object, so the
  // optional chaining is not covering a case any deployment reaches. It is
  // there for a scope that registers the proxy on its own — which the tests
  // do, to exercise this branch without standing up a Postgres session store.
  if (!request.session?.accessToken) {
    return reply.status(401).send({ error: 'unauthenticated' })
  }

  // A missing tokenExpiry reads as already expired, which refreshes rather than
  // forwarding a token of unknown age upstream.
  const secondsRemaining = (request.session.tokenExpiry ?? 0) - Math.floor(Date.now() / 1000)
  if (secondsRemaining >= REFRESH_WINDOW_SECONDS) {
    return undefined
  }

  try {
    // Single-flight per session, and it persists the rotated tokens itself —
    // which also satisfies ADR-004(d): the session is saved before the reply
    // starts, so @fastify/session's onSend hook stays on its synchronous no-op
    // path and cannot trigger the second reply.send() that caused
    // ERR_HTTP_HEADERS_SENT in Phase 2 (25a71a81).
    await refreshAccessToken(request)
  }
  catch (err: unknown) {
    if (err instanceof RefreshFailedError) {
      // Terminal: B2C rejected the refresh token and the session is already
      // destroyed. Clear the cookie so the browser stops presenting a dead sid,
      // as /auth/me does on the same verdict.
      request.log.info({ err }, '[proxy] session cannot be refreshed — returning 401')
      return reply.clearCookie('sessionId').status(401).send({ error: 'session_expired' })
    }
    // Transient — a network blip, B2C 5xx, a rotated-wrong client secret, a DB
    // error while saving. The session is intact, so this must NOT be a 401:
    // that would sign out every user the moment B2C hiccuped. 502 tells the
    // client to surface an error and leave the session alone.
    request.log.error({ err }, '[proxy] token refresh failed transiently — returning 502')
    return reply.status(502).send({ error: 'upstream_unavailable' })
  }

  return undefined
}

/**
 * The headers the upstream actually sees.
 *
 * Runs after `reply.from` has copied the request headers, set `host` to the
 * upstream, and stripped the hop-by-hop ones (`connection` and everything it
 * names), so this only has to deal with what is specific to the BFF.
 */
function rewriteRequestHeaders(request: ProxyRequest, headers: IncomingHttpHeaders): IncomingHttpHeaders {
  // Omitted by destructuring rather than deleted, because `headers` is the
  // object reply-from reuses across a retry.
  //
  //   cookie       — the session cookie is the BFF's credential; forwarding it
  //                  would hand the upstream a token-equivalent it has no use
  //                  for. This is what makes the proxy a trust boundary.
  //   authorization — never trust a client-supplied bearer token. Whatever the
  //                  browser sent is replaced below with the session's token,
  //                  or omitted entirely on an allowlisted path.
  //   x-csrf-token — consumed by the BFF (story 3-D); meaningless upstream.
  const { cookie, authorization, 'x-csrf-token': csrfToken, ...forwarded } = headers

  const upstream = upstreamPath(request.url)
  const accessToken = UNAUTHENTICATED_PATHS.has(upstream) ? undefined : request.session?.accessToken

  return {
    ...forwarded,
    // Sent by the client on every call today (Config.authOpts / textPlain), so
    // the upstream already expects it. Injected rather than merely forwarded so
    // it is true of every proxied request regardless of what the caller set.
    'x-app-id': 'DUOS',
    'x-forwarded-for': forwardedFor(request, forwarded['x-forwarded-for']),
    ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
  }
}

/**
 * The client-to-upstream address chain, with this pod appended as a hop.
 *
 * `request.ips` is the chain ordered closest-first — the socket peer, then the
 * inbound `X-Forwarded-For` entries right to left — so it reverses into the
 * header's original-client-first order. It is only populated when `trustProxy`
 * is set, which index.ts always does; the fallback keeps this correct for an
 * app that registers the proxy without it. Appending rather than replacing
 * matters because the BFF genuinely is a hop, and `request.ip` alone would
 * duplicate the entry the sidecar already added.
 */
function forwardedFor(request: ProxyRequest, inbound: string | string[] | undefined): string {
  if (request.ips) {
    return [...request.ips].reverse().join(', ')
  }
  const chain = Array.isArray(inbound) ? inbound.join(', ') : inbound
  return chain ? `${chain}, ${request.ip}` : request.ip
}

/**
 * The headers the browser actually sees — the return leg of the trust boundary.
 *
 * The rule is that the upstream may not write to this origin's state. A proxied
 * response is served from the BFF's own origin, so anything the DUOS API sends
 * here is applied as though the BFF had sent it:
 *
 *   set-cookie      — lands on the BFF origin, so an upstream response could
 *                     overwrite `sessionId` and hand the user a different
 *                     session (or a broken one). The request leg already
 *                     refuses to forward that cookie upstream; letting the
 *                     upstream set it back would undo the point of doing so.
 *   clear-site-data — clears cookies, storage and cache for the BFF origin,
 *                     which would sign the user out and wipe local state.
 *
 * Deliberately still forwarded, because they are not origin state and the client
 * needs them: `content-encoding` and `content-type` (a gzip body has to arrive
 * declared as one), `cache-control`, `etag`, `content-disposition` for the
 * document downloads. `strict-transport-security` and `www-authenticate` are the
 * two near misses — the first is origin *policy* rather than state and belongs
 * to the ingress, the second only matters once story 3-E decides what an
 * upstream 401 means; neither is stripped here.
 */
function rewriteHeaders(headers: IncomingHttpHeaders): IncomingHttpHeaders {
  // Omitted by destructuring rather than deleted, for the same reason as the
  // request leg: `headers` is the upstream's own `res.headers`, which reply-from
  // may hand back on a retry.
  const { 'set-cookie': setCookie, 'clear-site-data': clearSiteData, ...forwarded } = headers
  return forwarded
}
