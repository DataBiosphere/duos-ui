import type { FastifySessionOptions, SessionStore } from '@fastify/session'

/**
 * How the BFF registers `@fastify/session` — one factory, called by index.ts
 * and by every test harness that stands the plugin up.
 *
 * Shared for the same reason as `csrfPluginOptions` in `../auth/csrf.ts`: six
 * copies of these options existed (index.ts plus five harnesses), so the
 * security-relevant fields were only as strong as the copy a given test read.
 * `sameSite`, `rolling`, `saveUninitialized`, and `httpOnly` are all
 * load-bearing and all asserted somewhere in the suite; restated inline, a
 * change to production could leave every assertion green.
 *
 * The fields below are fixed here and cannot be passed in. What callers may
 * vary is only what genuinely differs between production and a harness: the
 * secret, the store, and the two environment-derived cookie values.
 *
 * Related: ADR-012 (`docs/plans/bff_adrs/ADR-012-session-cookie-samesite.md`)
 * records why `sameSite` is `Lax` and what closes the gap Lax leaves open.
 */

/** The `@fastify/session` default, and what index.ts and me.ts clear by name. */
export const SESSION_COOKIE_NAME = 'sessionId'

const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000

export interface SessionOptionsInput {
  /** Signing secret. Production validates it is ≥32 characters before calling. */
  secret: string
  /**
   * Session store. Omitted only by harnesses that accept `@fastify/session`'s
   * in-memory default; every real deployment passes the Postgres store.
   */
  store?: SessionStore
  /**
   * `Secure` on the cookie. Defaults to production-only, because local dev and
   * the test harnesses serve over plain HTTP and a `Secure` cookie would never
   * be stored. Pass `false` to pin that regardless of `NODE_ENV`.
   */
  secure?: boolean
  /** Cookie lifetime in ms. Defaults to `DUOS_SESSION_MAX_AGE_MS`, else 8 hours. */
  maxAge?: number
  /**
   * TEST ONLY — the SameSite mutation hook.
   *
   * Deliberately typed to exclude `'lax'`, so it cannot be used to restate the
   * production value in a harness (which is exactly the drift this module
   * exists to stop). Its only caller is the Strict half of the SameSite
   * browser-model suite in `server/test/auth.test.ts`, which needs an app
   * whose cookie is `Strict` in order to show the callback arriving
   * sessionless. Production never passes it.
   */
  sameSiteOverride?: 'strict' | 'none'
}

export function sessionPluginOptions(input: SessionOptionsInput): FastifySessionOptions {
  return {
    secret: input.secret,
    store: input.store,
    cookie: {
      httpOnly: true,
      secure: input.secure ?? process.env.NODE_ENV === 'production',
      // Lax, not Strict: the OAuth callback is a top-level redirect from B2C,
      // and Strict cookies are withheld from any navigation initiated
      // cross-site — the callback would arrive sessionless and lose the PKCE
      // verifier/state. Lax still withholds the cookie from cross-site
      // POSTs/fetches; session-bound CSRF tokens cover state-changing routes,
      // because Lax treats sibling `*.broadinstitute.org` subdomains as
      // same-site and so does not protect against a compromised sibling.
      //
      // This depends on B2C returning via GET (`response_mode=query`, the
      // code-flow default): with `response_mode=form_post` the redirect back
      // would be a cross-site POST and even Lax would withhold the cookie.
      // See ADR-012.
      sameSite: input.sameSiteOverride ?? 'lax',
      maxAge: input.maxAge ?? (Number(process.env.DUOS_SESSION_MAX_AGE_MS) || DEFAULT_MAX_AGE_MS),
      path: '/',
    },
    saveUninitialized: false,
    // `rolling: false` — MUST be set explicitly: @fastify/session defaults it
    // to true. Two reasons it matters here:
    //   1. Behavior: sessions get a fixed maxAge from creation. Rolling expiry
    //      would re-save the session (SELECT + UPSERT) on every session-bearing
    //      request just to bump `expire`. A throttled sliding expiry — re-save
    //      only when the session is near expiry — is the alternative if that
    //      behavior is ever wanted.
    //   2. Correctness: with rolling on, the onSend save hook fires an async
    //      DB write on every request that carries a session cookie, even when
    //      the handler already called `request.session.save()` and nothing
    //      else mutated the session. That async onSend leaves `reply.sent`
    //      false when the async route handler resolves, so Fastify's
    //      wrapThenable fires a SECOND reply.send(); the later save's writeHead
    //      then throws ERR_HTTP_HEADERS_SENT and crashes the process. With
    //      rolling off (+ saveUninitialized off + the pre-response save() in
    //      the auth handlers), onSend finds the session unmodified and skips
    //      the write synchronously, so the reply is fully sent before the
    //      handler promise resolves and no second send happens.
    rolling: false,
  }
}
