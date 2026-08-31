import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig, requireEnv } from './oidcClient.js'

/**
 * Retires the pre-auth session row once rotation has succeeded: stamp its audit
 * row, then delete it.
 *
 * Every step is best-effort and logged. The old row never received tokens, so
 * replaying its sid yields 401 whatever happens here — a failure is an
 * audit/cleanup problem, not a fixation attack, and must not fail a login that
 * has already succeeded.
 */
async function retirePreAuthSession(request: FastifyRequest, preAuthSid: string): Promise<void> {
  // Stamp the audit row BEFORE the delete. The delete fires Consent's
  // audit_session_end trigger, which fills end_reason with COALESCE(end_reason,
  // 'expired') — so without this, every successful login files its pre-auth row
  // as an expiry, and the audit table carries two rows per login where it used
  // to carry one. Same SQL, same hashing convention, and same best-effort
  // handling as the 'logout' stamp in logout.ts; user_session_audit and its
  // sid_hash-keyed triggers are Epic 1 infrastructure (DT-3606).
  try {
    await request.server.pg.query(
      `UPDATE user_session_audit
          SET end_reason = 'rotated'
        WHERE sid_hash = encode(sha256($1::bytea), 'hex') AND ended_at IS NULL`,
      [preAuthSid],
    )
  }
  catch (err: unknown) {
    request.log.error({ err }, '[auth] failed to stamp the pre-auth audit row as rotated')
  }

  // Destroy the pre-auth row so a fixated sid cannot linger as a live session.
  // request.session now points at the NEW session, so this must go through the
  // store, not request.session.destroy().
  //
  // The try/catch is the second half of "best-effort": the callback covers a
  // store that reports an error, this covers one that throws SYNCHRONOUSLY
  // instead of calling back (the Promise constructor turns that throw into a
  // rejection). pgStore always calls back (see pgStore.ts's run()), so nothing
  // reaches the catch today — but without it, a store that changed that
  // contract would 500 a login that has already succeeded. A store that
  // silently never calls back is out of reach of any catch and would hang the
  // handler; calling back exactly once is the SessionStore contract.
  try {
    await new Promise<void>((resolve) => {
      request.sessionStore.destroy(preAuthSid, (err) => {
        if (err) request.log.error({ err }, '[auth] failed to destroy pre-auth session row after rotation')
        resolve()
      })
    })
  }
  catch (err: unknown) {
    request.log.error({ err }, '[auth] failed to destroy pre-auth session row after rotation')
  }
}

/**
 * Exchanges the B2C authorization code for tokens, validates the `id_token`,
 * extracts the sub-provider from the B2C `idp` claim, and writes all tokens to
 * the session. The browser never sees a token — only the post-login redirect.
 */
export async function handleCallback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const config = await getOidcConfig()

  // v6: authorizationCodeGrant() takes the full callback URL and performs the
  // code exchange, state check, PKCE verification, and id_token validation
  // (signature, iss, aud, exp) in a single call — replacing v5's
  // callbackParams() + callback() pair. Only request.url's query string is
  // inspected; DUOS_OAUTH_REDIRECT_URI supplies the base so it parses as an
  // absolute URL.
  const currentUrl = new URL(request.url, requireEnv('DUOS_OAUTH_REDIRECT_URI'))
  let tokens: Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: request.session.pkceVerifier,
      expectedState: request.session.pkceState,
    })
  }
  catch (err: unknown) {
    if (err instanceof oidc.AuthorizationResponseError) {
      // B2C answered the authorization request with an error instead of a
      // code — the user canceled on the B2C page (access_denied), or B2C
      // itself failed. Land back in the SPA instead; a cancel is the user's
      // own action and stays silent. A cancel is also routine — info keeps
      // it out of warn-based alerting; real provider errors stay at warn.
      const cancelled = err.error === 'access_denied'
      request.log[cancelled ? 'info' : 'warn']({ error: err.error, description: err.error_description }, '[auth] B2C authorization response is an error')
      reply.redirect(cancelled ? '/' : '/?signInError=provider')
      return
    }
    throw err
  }

  const claims = tokens.claims() // undefined when no id_token is present

  if (typeof claims?.email !== 'string' || !claims.email) {
    reply.status(400).send({ error: 'token_missing_email_claim' })
    return
  }

  // B2C sets idp='google.com' when auth was federated to Google.
  // Verify the exact claim name ('idp' vs 'identityProvider') against the dev B2C tenant.
  const subProvider: 'google' | 'microsoft' = claims.idp === 'google.com' ? 'google' : 'microsoft'

  // Session fixation protection: rotate the session ID now that authentication
  // succeeded, so a sid planted before login never becomes an authenticated
  // session. regenerate() creates a NEW, EMPTY session and repoints
  // request.session at it — so capture what the pre-auth session must
  // hand over BEFORE rotating, and write tokens only AFTER. It never destroys
  // the old row, so that happens explicitly below via the store.
  const preAuthSid = request.session.sessionId
  // returnTo was validated to a same-origin path by safeReturnTo() at login —
  // only sanitized values ever reach the session. The pkce fields die with the
  // pre-auth session; nothing else carries over.
  const returnTo = request.session.returnTo ?? '/'

  await request.session.regenerate()

  request.session.accessToken = tokens.access_token
  request.session.refreshToken = tokens.refresh_token
  request.session.idToken = tokens.id_token
  // v6 exposes expires_in (seconds from now) via the expiresIn() helper —
  // there is no expires_at on the token response.
  request.session.tokenExpiry = Math.floor(Date.now() / 1000) + (tokens.expiresIn() ?? 0)
  request.session.userId = claims.email
  request.session.idp = subProvider

  // Persist the session BEFORE responding. Otherwise, @fastify/session saves it
  // in an async onSend hook (pgStore.set is a DB round-trip); since this handler
  // is async, its promise resolves while that save is still in flight, so
  // reply.sent is still false and Fastify's wrapThenable fires a SECOND
  // reply.send() — a duplicate onSend/session-save whose late writeHead throws
  // ERR_HTTP_HEADERS_SENT and crashes the process. Saving here resets the
  // session's modified-hash, so onSend finds it unmodified, skips the async
  // store write, and completes synchronously — no second send. regenerate()
  // does not remove that requirement. Save before destroying the old row: once
  // this succeeds, authentication has succeeded.
  await request.session.save()

  await retirePreAuthSession(request, preAuthSid)

  // Use the captured local — the returnTo field died with the pre-auth session.
  reply.redirect(returnTo)
}
