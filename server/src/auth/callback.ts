import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig, requireEnv } from './oidcClient.js'

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

  // Destroy the pre-auth row so a fixated sid cannot linger as a live session.
  // request.session now points at the NEW session, so this must go through the
  // store, not request.session.destroy(). In Postgres this DELETE fires the
  // audit_session_end trigger, which stamps the pre-auth audit row's ended_at.
  // Best-effort: the old row never received tokens, so replaying it yields 401
  // regardless — a transient deletion failure is an audit/cleanup problem, not
  // a fixation attack, and must not fail an otherwise successful login.
  await new Promise<void>((resolve) => {
    request.sessionStore.destroy(preAuthSid, (err) => {
      if (err) request.log.error({ err }, '[auth] failed to destroy pre-auth session row after rotation')
      resolve()
    })
  })

  // Use the captured local — the returnTo field died with the pre-auth session.
  reply.redirect(returnTo)
}
