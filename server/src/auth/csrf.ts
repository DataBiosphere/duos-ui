import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * How the BFF registers `@fastify/csrf-protection` — one object, imported by
 * index.ts and by every test harness that stands the plugin up.
 *
 * Shared rather than repeated because it drifted once already: review of story
 * 3-D found three different CSRF configurations across the suite (index.ts's,
 * a copy of the same lambda in apiProxy.test.ts, and the plugin's bare defaults
 * in auth.test.ts), which meant deleting the `getToken` narrowing below left the
 * whole suite green — and that auth.test.ts's logout tests would have accepted a
 * body-borne token production rejects. Anything registering this plugin has to
 * use this object, so the narrowing cannot be lost without a test noticing.
 */

/**
 * The one header the BFF reads a CSRF token from.
 *
 * `/auth/csrf-token` tells the client to send this and nothing else; the proxy
 * strips it before forwarding, since it is meaningless upstream.
 */
export const CSRF_HEADER = 'x-csrf-token'

/**
 * Header-only, narrowed from the plugin's default — which also accepts
 * `body._csrf` and three further header spellings (`csrf-token`, `xsrf-token`,
 * `x-xsrf-token`). Two reasons, per ADR-004(c):
 *
 *   - Bodies pass through the proxy unparsed, so a body-borne token could not be
 *     read there without buffering the upload it is attached to.
 *   - One documented spelling is a clearer contract than four, and it is the one
 *     `/auth/csrf-token` hands out.
 *
 * `sessionPlugin` ties the secret to `@fastify/session`, which is why the plugin
 * must be registered after it.
 */
export const csrfPluginOptions = {
  sessionPlugin: '@fastify/session',
  getToken: (request: FastifyRequest): string | undefined =>
    request.headers[CSRF_HEADER] as string | undefined,
} as const

/**
 * GET /auth/csrf-token — gated on an authenticated session (Epic 5, story 5-B).
 *
 * The route always documented itself as a post-sign-in call, but nothing
 * enforced that: any same-origin request minted an anonymous session row (the
 * secret `generateCsrf()` writes is what triggers the save) plus a token for
 * it. The gate closes that: no user in the session means 401, and because the
 * rejection happens before `generateCsrf()`, nothing is written and no row is
 * created (`saveUninitialized: false`).
 *
 * `accessToken` is the authentication marker for the same reason the proxies
 * and /auth/me key on it: it exists exactly from the OAuth callback until the
 * session is destroyed. A pre-auth session (PKCE fields only) is rejected too
 * — by design, since /auth/login is deliberately CSRF-exempt and nothing
 * pre-auth needs a token.
 *
 * Shared here, like `csrfPluginOptions` above and for the same reason: the
 * route existed in three copies (index.ts, proxyTestHarness.ts, auth.test.ts),
 * so a gate added only in index.ts would leave every suite green while testing
 * an ungated route production no longer has.
 *
 * The optional chain on `request.session` is for index.test.ts, which mocks
 * @fastify/session away; everywhere real, the session plugin guarantees an
 * object.
 */
export async function handleCsrfToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.session?.accessToken) {
    reply.status(401).send({ error: 'unauthenticated' })
    return
  }
  const token = reply.generateCsrf()
  // generateCsrf() writes the secret into the session on first use, so persist
  // before replying — the same pre-response save as me.ts and callback.ts:
  // with rolling off, an unsaved modification makes @fastify/session's async
  // onSend save race Fastify's wrapThenable into a second reply.send()
  // (ERR_HTTP_HEADERS_SENT — see index.ts on the session config).
  await request.session.save()
  reply.send({ token })
}
