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

/**
 * The BFF upstream proxy machinery.
 *
 * A proxied call is forwarded from here with the session's B2C access token
 * attached, so the browser never holds a bearer token. The shape of this module
 * is set by ADR-004 (docs/plans/bff_adrs/ADR-004-api-proxy-layer.md), which
 * chose `@fastify/reply-from` inside a route the BFF declares itself over
 * `@fastify/http-proxy` or a hand-rolled `fetch` loop. The three things worth
 * re-reading there:
 *
 *   - **Bodies stream, unparsed.** DUOS uploads `multipart/form-data` and
 *     `application/binary` and downloads blobs. Fastify would 415 the former
 *     before this handler ran and hand the latter over pre-parsed, so this
 *     scope clears every content-type parser and installs one pass-through.
 *   - **One prefix per upstream, mapped to the upstream root.** A `/api/*`
 *     wildcard under-covers (9 of the DUOS API's paths sit outside `/api`), and
 *     a dedicated prefix cannot collide with the BFF's own routes.
 *   - **Some paths are called unauthenticated today**, and proxy through with
 *     no session and no injected `Authorization` — which paths is per-upstream
 *     (`UpstreamProxyConfig.unauthenticatedPaths`).
 *
 * Written for the DUOS API and generalized by story when ECM needed a second
 * proxied upstream with the identical rules. Everything upstream-specific arrives
 * through `UpstreamProxyConfig`; the security behavior — what is stripped, what
 * is injected, how responses are hardened — is deliberately not configurable, so
 * a new upstream cannot opt out of it.
 *
 * Registered inside index.ts's `if (process.env.DUOS_DB_HOST)` block, under the
 * same `bffEnabled === true` gate as the `/auth/*` routes — not just for
 * symmetry: the session-ending paths below call `reply.clearCookie`, a
 * `@fastify/cookie` decorator index.ts registers only inside that block.
 */

/** What distinguishes one proxied upstream from another. */
export interface UpstreamProxyConfig {
  /** The BFF-side prefix, e.g. `/duos-api`. `<prefix>/<path>` → `<upstream>/<path>`. */
  prefix: string
  /**
   * The env var naming the upstream origin, e.g. `DUOS_API_URL`. Read and
   * validated at registration so a bad value fails at startup naming the
   * variable, rather than 500ing every proxied request.
   */
  upstreamEnvVar: string
  /** Log-line tag: every line this proxy's scope logs starts `[<logTag>]`. */
  logTag: string
  /**
   * Paths the client calls with no `Authorization` header today, matched
   * exactly. They proxy through without a session, and without a token even
   * when there IS a session — matching current client behavior exactly is the
   * point, so cutover cannot change what the upstream sees.
   */
  unauthenticatedPaths: ReadonlySet<string>
  /**
   * The only *unsafe* requests exempt from CSRF, keyed `'METHOD /path'`.
   * Deliberately separate from `unauthenticatedPaths` — see the DUOS API's set
   * in apiProxy.ts for why keying the exemption on that set would widen it.
   */
  csrfExemptUnsafeRequests: ReadonlySet<string>
  /**
   * Whether a 401 from the upstream on a token-carrying request destroys the
   * BFF session. True where the upstream validates the session's B2C access
   * token exactly as the BFF does (the DUOS API): its 401 means the token is
   * dead, and with proactive refresh already running, so is the session. False
   * where the upstream authenticates differently (ECM): its 401 can mean an
   * audience mismatch or an upstream-side account problem, and ending the DUOS
   * session over it would sign the user out of everything because one linked
   * subsystem disagreed.
   */
  destroySessionOnUpstream401: boolean
}

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
 * This caps throughput at roughly `connections ÷ upstream latency`; measured
 * capacity remains well above expected load. See server/test/load/README.md.
 */
export const UPSTREAM_POOL_CONNECTIONS = 128

export interface UpstreamProxyOptions {
  undiciConnections?: number
}

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

// A 403 alone is ambiguous because the upstream can also deny writes.
export const CSRF_ERROR_CODE = 'csrf_validation_failed'

const CSRF_REJECTION_REASONS: ReadonlyMap<string, string> = new Map([
  ['FST_CSRF_MISSING_SECRET', 'missing_secret'],
  ['FST_CSRF_INVALID_TOKEN', 'invalid_token'],
])

// Proxied uploads are served from the SPA's origin, so they must not execute there.
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
 * Strips the BFF prefix and the query string, yielding the upstream path.
 *
 * The query is dropped on purpose rather than forwarded here: `reply.from()`
 * re-appends the original query from `request.raw.url` byte-for-byte when the
 * source it is given carries none. Passing it through `new URL()` instead would
 * re-encode it, and paths like `/ontology/autocomplete?q=…` cannot afford that.
 */
export function upstreamPath(url: string, prefix: string): string {
  const queryIndex = url.indexOf('?')
  const path = queryIndex === -1 ? url : url.slice(0, queryIndex)
  // The `|| '/'` is defensive, not a routing case: `<prefix>/*` does not match
  // the bare prefix, so `/duos-api` 404s before reaching here and `/duos-api/`
  // already slices to '/'. It only guarantees this exported helper never hands
  // `reply.from` an empty source string.
  return path.slice(prefix.length) || '/'
}

/**
 * `reply.from`'s hooks are typed against `RawServerBase` — the http/http2 union
 * — rather than this app's concrete server, so the callbacks below have to be
 * too, or they are rejected as contravariantly incompatible. Nothing any of them
 * touches differs between the two server types.
 */
type ProxyRequest = FastifyRequest<RequestGenericInterface, RawServerBase>
type ProxyReply = FastifyReply<RouteGenericInterface, RawServerBase>

// reply-from types this as a ServerResponse even though the stream is incoming.
type UpstreamResponse = RawReplyDefaultExpression<RawServerBase> & { stream: IncomingMessage }

function upstreamHeaders(res: UpstreamResponse): IncomingHttpHeaders {
  return (res as unknown as { headers: IncomingHttpHeaders }).headers
}

/**
 * Registers a proxy for one upstream. The caller hands this to
 * `fastify.register()` via a named wrapper (`apiProxy`, `ecmProxy`) so each
 * upstream gets its own encapsulated scope — the encapsulation is the point:
 * `removeAllContentTypeParsers()` below must apply to this scope only, or
 * `/auth/*` would lose its JSON parsing too. (For the same reason, none of the
 * wrappers is wrapped in `fastify-plugin`.)
 */
export async function registerUpstreamProxy(
  app: FastifyInstance,
  config: UpstreamProxyConfig,
  options: UpstreamProxyOptions = {},
): Promise<void> {
  const { logTag, prefix } = config

  // Fail at startup rather than serve the proxy unguarded. The decorator comes
  // from @fastify/csrf-protection, registered in index.ts; if the proxy were
  // ever moved ahead of it, the alternative to this check is a route that
  // accepts cookie-authenticated writes from any origin.
  if (!app.hasDecorator('csrfProtection')) {
    throw new Error(`the ${prefix} proxy requires @fastify/csrf-protection to be registered first — it enforces CSRF on unsafe methods and must not be registered without it`)
  }

  const upstream = upstreamBase(config.upstreamEnvVar)

  const pathFor = (url: string): string => upstreamPath(url, prefix)

  const injectedAccessToken = (request: ProxyRequest): string | undefined => {
    if (config.unauthenticatedPaths.has(pathFor(request.url))) {
      return undefined
    }
    return request.session?.accessToken
  }

  // Encapsulation prevents the root handler registered later from applying here.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const reason = err.code === undefined ? undefined : CSRF_REJECTION_REASONS.get(err.code)
    if (reason !== undefined) {
      request.log.info({ err }, `[${logTag}] CSRF validation failed — rejecting`)
      return reply.status(403).send({ error: CSRF_ERROR_CODE, reason })
    }
    request.log.error({ err }, `[${logTag}] unhandled error`)
    return reply.status(err.statusCode ?? 500).send({ error: 'An unexpected error occurred.' })
  })

  /**
   * CSRF on state-changing methods. The proxy turns every upstream write into a
   * cookie-authenticated request, so this is a requirement of the proxy, not
   * later hardening.
   *
   * Callback style, not `await`ed: `csrfProtection` takes a `done` callback and
   * returns undefined, so awaiting it would call `next()` as undefined and throw
   * a TypeError on the *passing* path — a failure that only shows up once a
   * valid token arrives.
   *
   * Unsafe requests exempt from enforcement are named individually per upstream
   * (`config.csrfExemptUnsafeRequests`), never derived from the unauthenticated
   * allowlist — see that field's comment and apiProxy.ts.
   */
  const csrfForUnsafeMethods = (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ): void => {
    const exempt = CSRF_EXEMPT_METHODS.has(request.method)
      || config.csrfExemptUnsafeRequests.has(`${request.method} ${pathFor(request.url)}`)
    if (exempt) {
      done()
      return
    }
    app.csrfProtection(request, reply, done)
  }

  /**
   * Gate and token freshness, ahead of the handler.
   *
   * Returns the reply on the failure paths: in an async hook Fastify needs the
   * reply returned to know the response was already sent, otherwise it carries
   * on to the handler.
   */
  const ensureUpstreamAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | undefined> => {
    if (config.unauthenticatedPaths.has(pathFor(request.url))) {
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
        request.log.info({ err }, `[${logTag}] session cannot be refreshed — returning 401`)
        return reply.clearCookie('sessionId').status(401).send({ error: 'session_expired' })
      }
      // Transient — a network blip, B2C 5xx, a rotated-wrong client secret, a DB
      // error while saving. The session is intact, so this must NOT be a 401:
      // that would sign out every user the moment B2C hiccuped. 502 tells the
      // client to surface an error and leave the session alone.
      request.log.error({ err }, `[${logTag}] token refresh failed transiently — returning 502`)
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
  const rewriteRequestHeaders = (request: ProxyRequest, headers: IncomingHttpHeaders): IncomingHttpHeaders => {
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

  const onUpstreamResponse = (request: ProxyRequest, reply: ProxyReply, res: UpstreamResponse): void => {
    // An upstream 401 ends the session only where the config says the upstream's
    // verdict on the token is authoritative — see `destroySessionOnUpstream401`.
    const endsSession = config.destroySessionOnUpstream401
      && res.statusCode === 401
      && injectedAccessToken(request) !== undefined
    if (!endsSession) {
      reply.send(res.stream)
      return
    }

    // Drain the replaced response so undici can reuse its socket.
    res.stream.on('error', (err: Error) => {
      request.log.debug({ err }, `[${logTag}] discarded upstream 401 body errored`)
    })
    res.stream.resume()

    // Remove metadata for the discarded body; preserve reply-from's connection header.
    for (const name of Object.keys(upstreamHeaders(res))) {
      if (name !== 'connection') {
        reply.removeHeader(name)
      }
    }

    // reply-from's onResponse callback is synchronous.
    void endRejectedSession(request, reply, logTag)
  }

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
    base: upstream,
    undici: { connections: options.undiciConnections ?? UPSTREAM_POOL_CONNECTIONS },
  })

  app.all(`${prefix}/*`, {
    onRequest: csrfForUnsafeMethods,
    preHandler: ensureUpstreamAuth,
  }, (request, reply) => {
    reply.from(pathFor(request.url), {
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
 * at 500 — so the commonest way for an upstream to be down reaches the browser
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
 * The upstream env var must hold an origin with no path — `reply.from` builds
 * the upstream as `new URL(source, base)`, which discards a base path and then
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
function upstreamBase(envVar: string): string {
  const base = requireEnv(envVar)
  const mustBeOrigin = 'it must be a bare origin (scheme, host, and port only), because the proxy appends the upstream path to it'

  let parsed: URL
  try {
    parsed = new URL(base)
  }
  catch {
    throw new Error(`${envVar} is '${base}', which is not a valid URL — ${mustBeOrigin}. Include the scheme, e.g. https://duos.example.org`)
  }

  // Checked before the branches below because every one of them echoes the
  // raw value into the error, which lands in the startup log — and a URL with
  // userinfo is the one shape whose raw value may carry a real password.
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error(`${envVar} contains userinfo credentials (value withheld from this message) — ${mustBeOrigin}`)
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${envVar} is '${base}', whose scheme is '${parsed.protocol}' — ${mustBeOrigin}. Expected http or https, e.g. https://duos.example.org`)
  }

  if (parsed.pathname !== '/') {
    throw new Error(`${envVar} is '${base}', which has a path — ${mustBeOrigin}`)
  }

  // A query or fragment would not fail loudly like a path does — new URL(source,
  // base) just discards them — so the misconfiguration they signal would
  // otherwise be silently half-honored.
  if (parsed.search !== '' || parsed.hash !== '') {
    throw new Error(`${envVar} is '${base}', which has a query string or fragment — ${mustBeOrigin}`)
  }

  return base
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
 * response is served from the BFF's own origin, so anything the upstream sends
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
  return Object.fromEntries(
    Object.entries(forwarded).filter(([name]) => !CONNECTION_SPECIFIC_RESPONSE_HEADERS.has(name)),
  )
}

async function endRejectedSession(request: ProxyRequest, reply: ProxyReply, logTag: string): Promise<void> {
  try {
    await request.session.destroy()
    request.log.info(`[${logTag}] upstream rejected the session access token — session destroyed, returning 401`)
  }
  catch (err: unknown) {
    request.log.error({ err }, `[${logTag}] upstream rejected the session access token but the session could not be destroyed — returning 401 anyway`)
  }
  reply.clearCookie('sessionId').status(401).send({ error: 'session_expired' })
}
