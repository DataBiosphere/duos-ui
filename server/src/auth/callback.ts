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

  request.session.accessToken = tokens.access_token
  request.session.refreshToken = tokens.refresh_token
  request.session.idToken = tokens.id_token
  // v6 exposes expires_in (seconds from now) via the expiresIn() helper —
  // there is no expires_at on the token response.
  request.session.tokenExpiry = Math.floor(Date.now() / 1000) + (tokens.expiresIn() ?? 0)
  request.session.userId = claims.email
  request.session.idp = subProvider
  delete request.session.pkceVerifier
  delete request.session.pkceState

  // Persist the session BEFORE responding. Otherwise, @fastify/session saves it
  // in an async onSend hook (pgStore.set is a DB round-trip); since this handler
  // is async, its promise resolves while that save is still in flight, so
  // reply.sent is still false and Fastify's wrapThenable fires a SECOND
  // reply.send() — a duplicate onSend/session-save whose late writeHead throws
  // ERR_HTTP_HEADERS_SENT and crashes the process. Saving here resets the
  // session's modified-hash, so onSend finds it unmodified, skips the async
  // store write, and completes synchronously — no second send.
  await request.session.save()

  // returnTo was validated to a same-origin path by safeReturnTo() at login —
  // only sanitized values ever reach the session.
  reply.redirect(request.session.returnTo ?? '/')
}
