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
import fastifyReplyFrom from '@fastify/reply-from'
import { requireEnv } from '../auth/oidcClient.js'
import { RefreshFailedError, refreshAccessToken } from '../auth/refresh.js'
import { GENERIC_ERROR_BODY } from '../errors.js'

/**
 * The BFF API proxy (Phase 3).
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
 * Registered inside index.ts's `if (process.env.DUOS_DB_HOST)` block, under the
 * same `bffEnabled === true` gate as the `/auth/*` routes — not just for
 * symmetry: the session-ending paths below call `reply.clearCookie`, a
 * `@fastify/cookie` decorator index.ts registers only inside that block.
 */

/**
 * The BFF-side prefix. `/duos-api/api/dataset/1` → `${DUOS_API_URL}/api/dataset/1`.
 *
 * Public API surface between client and BFF: Phase 4 makes `getApiUrl()` return
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
 * Methods CSRF enforcement does not apply to, per the usual definition of safe.
 *
 * A CSRF token cannot protect a GET in any case: `SameSite=Lax` deliberately
 * sends the session cookie on top-level GET navigations, so a plain link would
 * carry it. That makes any upstream endpoint which mutates state on GET
 * forgeable, which is why story 3-D audits for them — see
 * docs/plans/bff_adrs/ADR-009-state-changing-gets.md for the two that exist and
 * why they are proxied anyway.
 */
const CSRF_EXEMPT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * The only *unsafe* requests exempt from CSRF: the signed-out Contact Us form.
 *
 * Keyed on method and path together, and deliberately narrower than
 * `UNAUTHENTICATED_PATHS` — that set also holds read-only endpoints (`/status`,
 * `/oauth2/configuration`, `/tos/text/duos`), so keying the exemption on it would
 * waive CSRF for an unsafe method against any of them.
 *
 * Nothing is exploitable either way today: allowlisted paths get no injected
 * `Authorization` and the caller's own cookie and `authorization` are stripped
 * before forwarding, so a forged write to one of them reaches the upstream
 * unauthenticated — a request anyone can already make without a victim, borrowing
 * no authority, which is the only thing CSRF protects. But that safety lives in
 * `rewriteRequestHeaders`, not here, and a path-keyed exemption would widen
 * silently if the allowlist or the token logic ever changed.
 *
 * Drift fails closed: an unauthenticated POST added to `UNAUTHENTICATED_PATHS`
 * but not here is rejected with `MissingCSRFSecretError` — loud and caught in
 * tests — rather than quietly exempted.
 */
export const CSRF_EXEMPT_UNSAFE_REQUESTS: ReadonlySet<string> = new Set([
  'POST /support/request',
  'POST /support/upload',
])

/**
 * The one thing about a proxy error the client branches on (ADR-010): Phase 4's
 * fetch layer refetches a token and retries once on it. The status cannot carry
 * that signal — an upstream authorization denial also arrives as a 403, so
 * retrying on the status would replay every write the DUOS API refused.
 */
export const CSRF_ERROR_CODE = 'csrf_validation_failed'

/**
 * `@fastify/csrf-protection`'s rejections, mapped to the reason the BFF
 * publishes. Both share one `error`, since both call for the same single retry;
 * `reason` is diagnostic, and lets a test assert which path actually fired.
 *
 * The plugin's own code stays off the wire: it is renameable internals, and
 * `code` in an error body already means something else to this client
 * (`DataAccessRequestApplication.tsx` reads it as "the upstream sent a structured
 * error, so render its `message`").
 */
const CSRF_REJECTION_REASONS: ReadonlyMap<string, string> = new Map([
  ['FST_CSRF_MISSING_SECRET', 'missing_secret'],
  ['FST_CSRF_INVALID_TOKEN', 'invalid_token'],
])

/**
 * Added to every response the proxy scope emits, so nothing the upstream returns
 * can execute on the SPA's origin.
 *
 * The proxy introduces this risk: DUOS serves user-uploaded documents back
 * through the API, and proxied they come from the BFF's *own* origin, so a
 * top-level navigation to one renders attacker-uploaded markup on the origin
 * holding the session. `sandbox` gives such a document an opaque origin and no
 * scripts; `nosniff` stops one being promoted to a document by content sniffing.
 * Unconditional, and overriding an upstream that sends either header, because
 * the safety must not depend on the content type the upstream declared.
 *
 * Applied in `onSend` rather than `rewriteHeaders`, which reaches only responses
 * that came back from the upstream: `onSend` runs after `onUpstreamResponse`
 * strips the upstream's headers off a replaced 401, and covers the replies the
 * proxy writes for itself.
 *
 * Inert for the client — `fetch` ignores both, and every document path is a
 * `fetchBlob` download. Re-check when Phase 4 rewrites the fetch layer.
 */
const RESPONSE_HARDENING: Readonly<IncomingHttpHeaders> = {
  'x-content-type-options': 'nosniff',
  'content-security-policy': 'sandbox',
}

/**
 * Stripped on the way back: they describe the BFF↔upstream hop rather than the
 * response (RFC 9110 §7.6.1), and the browser is on a different connection.
 *
 * Not a theoretical list. Node's HTTP server emits `keep-alive` automatically,
 * so a Node upstream leaks its own socket timeout to every browser until this
 * strips it; `proxy-authenticate` is `www-authenticate`'s proxy-side twin, and
 * relaying it reintroduces on the BFF's origin exactly the credential prompt
 * that header is stripped below to prevent.
 *
 * `connection` and `transfer-encoding` are deliberately absent: reply-from sets
 * `connection` itself (see `onUpstreamResponse`, which preserves it for that
 * reason), and an upstream `transfer-encoding` is renormalised by undici and
 * Fastify to the framing actually used on the way out — pinned by a test.
 */
const CONNECTION_SPECIFIC_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'upgrade',
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
 * The token this proxy will inject for a request, or undefined when it injects
 * none. Shared by the request leg (which sets the header) and the response leg
 * (which reads an upstream 401 as a verdict on it), so only requests that
 * borrowed the session's authority are signed out by a 401.
 */
function injectedAccessToken(request: ProxyRequest): string | undefined {
  if (UNAUTHENTICATED_PATHS.has(upstreamPath(request.url))) {
    return undefined
  }
  return request.session?.accessToken
}

/**
 * `reply.from`'s hooks are typed against `RawServerBase` — the http/http2 union
 * — rather than this app's concrete server, so the callbacks below have to be
 * too, or they are rejected as contravariantly incompatible. Nothing any of them
 * touches differs between the two server types.
 */
type ProxyRequest = FastifyRequest<RequestGenericInterface, RawServerBase>
type ProxyReply = FastifyReply<RouteGenericInterface, RawServerBase>

/**
 * What `reply.from` hands `onResponse`: the upstream reply, body still unread.
 *
 * Mirrors reply-from's own `RawServerResponse`, because the hook's parameter
 * position is contravariant and rejects anything wider — inaccuracy included.
 * The declared `ServerResponse` is really undici's incoming response, so
 * `statusCode` and `stream` line up but `headers` is undeclared.
 */
type UpstreamResponse = RawReplyDefaultExpression<RawServerBase> & { stream: IncomingMessage }

/** The upstream's response headers, which `UpstreamResponse` cannot declare. */
function upstreamHeaders(res: UpstreamResponse): IncomingHttpHeaders {
  return (res as unknown as { headers: IncomingHttpHeaders }).headers
}

/**
 * Registers the proxy. Not wrapped in `fastify-plugin` — the encapsulation is
 * the point: `removeAllContentTypeParsers()` below must apply to this scope
 * only, or `/auth/*` would lose its JSON parsing too.
 */
export async function apiProxy(app: FastifyInstance): Promise<void> {
  // Fail at startup rather than serve the proxy unguarded. The decorator comes
  // from @fastify/csrf-protection, registered in index.ts; if the proxy were
  // ever moved ahead of it, the alternative to this check is a route that
  // accepts cookie-authenticated writes from any origin.
  if (!app.hasDecorator('csrfProtection')) {
    throw new Error('apiProxy requires @fastify/csrf-protection to be registered first — it enforces CSRF on unsafe methods and must not be registered without it')
  }

  /**
   * The proxy scope's error shape (ADR-010). Declared here because an
   * encapsulated scope copies whatever error handler exists when it is created,
   * and index.ts sets the app's *after* registering this plugin.
   *
   * reply.from's transport failures never arrive here — `onUpstreamTransportError`
   * answers those — so the generic branch means a bug on a proxy path.
   */
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const reason = err.code === undefined ? undefined : CSRF_REJECTION_REASONS.get(err.code)
    if (reason !== undefined) {
      // Info, not error: a rejected token is the guard working, usually against
      // a client whose token went stale.
      request.log.info({ err }, '[proxy] CSRF validation failed — rejecting')
      // 403 stated rather than taken from `err.statusCode`: part of the contract
      // ADR-010 pins, not a detail of the plugin that raised it.
      return reply.status(403).send({ error: CSRF_ERROR_CODE, reason })
    }
    request.log.error({ err }, '[proxy] unhandled error')
    return reply.status(err.statusCode ?? 500).send(GENERIC_ERROR_BODY)
  })

  /**
   * CSRF on state-changing methods. The proxy turns every DUOS API write into a
   * cookie-authenticated request, so this is a requirement of the proxy, not
   * later hardening.
   *
   * Callback style, not `await`ed: `csrfProtection` takes a `done` callback and
   * returns undefined, so awaiting it would call `next()` as undefined and throw
   * a TypeError on the *passing* path — a failure that only shows up once a
   * valid token arrives.
   *
   * The two signed-out Contact Us POSTs are exempt, and have to be: with no
   * session there is no CSRF secret, so enforcement would reject them with
   * MissingCSRFSecretError. They are named individually rather than taken from
   * `UNAUTHENTICATED_PATHS` — see `CSRF_EXEMPT_UNSAFE_REQUESTS`.
   */
  const csrfForUnsafeMethods = (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ): void => {
    const exempt = CSRF_EXEMPT_METHODS.has(request.method)
      || CSRF_EXEMPT_UNSAFE_REQUESTS.has(`${request.method} ${upstreamPath(request.url)}`)
    if (exempt) {
      done()
      return
    }
    app.csrfProtection(request, reply, done)
  }

  // See RESPONSE_HARDENING for why a hook rather than `rewriteHeaders`. Callback
  // style so the payload — a stream on the proxied path — passes through
  // untouched, rather than relying on how an async hook reads an undefined return.
  app.addHook('onSend', (_request, reply, _payload, done) => {
    reply.headers(RESPONSE_HARDENING)
    done()
  })

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

  app.all(`${PROXY_PREFIX}/*`, {
    onRequest: csrfForUnsafeMethods,
    preHandler: ensureUpstreamAuth,
  }, (request, reply) => {
    reply.from(upstreamPath(request.url), {
      rewriteRequestHeaders,
      rewriteHeaders,
      onResponse: onUpstreamResponse,
      onError: onUpstreamTransportError,
    })
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

  const accessToken = injectedAccessToken(request)

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
 *   www-authenticate — a challenge for a bearer scheme this origin no longer
 *                     uses: the browser holds a session cookie and has no token
 *                     to re-present, and a `Basic` challenge would pop a native
 *                     credential dialog on the BFF's origin. Stripped on every
 *                     status, since the 401s an allowlisted path passes through
 *                     carry it too.
 *
 * Deliberately still forwarded, because they are not origin state and the client
 * needs them: `content-encoding` and `content-type` (a gzip body has to arrive
 * declared as one), `cache-control`, `etag`, `content-disposition` for the
 * document downloads. `strict-transport-security` is the near miss — origin
 * *policy* rather than state, already settled by the ingress, so left alone.
 *
 * The second class dropped is the wrong hop rather than origin state; see
 * `CONNECTION_SPECIFIC_RESPONSE_HEADERS`.
 */
function rewriteHeaders(headers: IncomingHttpHeaders): IncomingHttpHeaders {
  // Omitted by destructuring rather than deleted, for the same reason as the
  // request leg: `headers` is the upstream's own `res.headers`, which reply-from
  // may hand back on a retry.
  const {
    'set-cookie': setCookie,
    'clear-site-data': clearSiteData,
    'www-authenticate': wwwAuthenticate,
    ...forwarded
  } = headers
  // Node lower-cases incoming header names, so a direct lookup needs no folding.
  return Object.fromEntries(
    Object.entries(forwarded).filter(([name]) => !CONNECTION_SPECIFIC_RESPONSE_HEADERS.has(name)),
  )
}

/**
 * The upstream's verdict on the token this proxy injected.
 *
 * A 401 means the DUOS API rejected that access token — expired early, revoked,
 * or issued to a user it no longer knows — even though the session looked valid
 * enough for `ensureUpstreamAuth` to forward the request. It cannot recover on
 * its own, so it is destroyed and the browser gets a 401 to redirect on, exactly
 * as `/auth/me` does on the same verdict. Not new behaviour: the legacy client
 * already signs out on any 401 from the DUOS API
 * (`fetchAdapter.handleResponse` → `redirectOnLogout`). Its `GET /api/user/me`
 * exemption is not carried over — that exists to stop a *client-side* redirect
 * loop on the auth probe, and me.ts already destroys on it.
 *
 * Everything else streams through untouched, which is all reply-from's default
 * `onResponse` does by this point: the (rewritten) headers and status are on the
 * reply already, so only the body is left.
 */
function onUpstreamResponse(request: ProxyRequest, reply: ProxyReply, res: UpstreamResponse): void {
  if (res.statusCode !== 401 || injectedAccessToken(request) === undefined) {
    reply.send(res.stream)
    return
  }

  // The discarded 401 body still has to be read: an unconsumed response keeps
  // its undici socket checked out of the pool. Drained rather than destroyed,
  // which preserves connection reuse. The error listener is required, not
  // defensive — an 'error' with no listener is an unhandled exception, and
  // reply-from's default path only gets one because `reply.send` attaches it.
  res.stream.on('error', (err: Error) => {
    request.log.debug({ err }, '[proxy] discarded upstream 401 body errored')
  })
  res.stream.resume()

  // The upstream headers reply-from already copied onto the reply describe a
  // body that is no longer being sent. `content-type` alone is fatal: Fastify
  // only serialises an object payload when the type is JSON or unset, so an
  // upstream `text/plain` 401 would throw FST_ERR_REP_INVALID_PAYLOAD_TYPE. The
  // rest merely mislead — a gzip label, a stale etag, a length for a body nobody
  // received.
  //
  // Keyed off `res.headers` so only what came from the upstream goes, except
  // `connection`: reply-from sets that to `close` when the upstream answered
  // before the request body was read, which describes this connection rather
  // than the discarded response.
  for (const name of Object.keys(upstreamHeaders(res))) {
    if (name !== 'connection') {
      reply.removeHeader(name)
    }
  }

  // Not awaited: reply-from's onResponse is synchronous and ignores what it
  // returns, so an unhandled rejection would take the pod down with it.
  // `endRejectedSession` resolves every failure into a reply of its own.
  void endRejectedSession(request, reply)
}

/**
 * Destroys the session the upstream just rejected, then answers the browser.
 *
 * Replying after the destroy resolves is what keeps `@fastify/session`'s onSend
 * hook out of the way: `destroy()` nulls `request.session`, so the hook finds
 * nothing to save rather than writing the dead session back on the way out.
 */
async function endRejectedSession(request: ProxyRequest, reply: ProxyReply): Promise<void> {
  try {
    await request.session.destroy()
    request.log.info('[proxy] upstream rejected the session access token — session destroyed, returning 401')
  }
  catch (err: unknown) {
    // The row is left to expire on its own schedule, and the 401 still goes out:
    // a 500 would only tell the client to retry a request that can earn another
    // 401, and the cleared cookie stops this browser presenting the sid anyway.
    request.log.error({ err }, '[proxy] upstream rejected the session access token but the session could not be destroyed — returning 401 anyway')
  }
  // Cleared for the same reason the fatal-refresh path does: with the row gone,
  // a browser still presenting the sid gets a new empty session every request.
  reply.clearCookie('sessionId').status(401).send({ error: 'session_expired' })
}
