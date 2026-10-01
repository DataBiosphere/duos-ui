import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { logAuthEvent } from './authEvents.js'
import { getOidcConfig, requireEnv } from './oidcClient.js'
import { establishSession } from '../session/rotation.js'

/**
 * Maps the B2C `idp` claim to the sub-provider the user chose on the B2C login page.
 */
export function subProviderFromIdpClaim(idp: unknown): 'google' | 'microsoft' | 'unknown' {
  if (idp === 'google.com') return 'google'
  if (typeof idp === 'string' && idp.startsWith('https://login.microsoftonline.com/')) return 'microsoft'
  return 'unknown'
}

type CallbackResult
  = { outcome: 'succeeded' | 'cancelled' }
    | { outcome: 'failed', errorType: string }

/**
 * Runs the callback and emits one `auth.callback.completed` event per entry.
 * Cancellations count in the denominator and stay out of the failure numerator.
 */
export async function handleCallback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  let result: CallbackResult
  try {
    result = await processCallback(request, reply)
  }
  catch (err: unknown) {
    logAuthEvent(request, 'auth.callback.completed', { outcome: 'failed', errorType: err instanceof Error ? err.name : 'unknown' }, 'warn')
    throw err
  }
  logAuthEvent(request, 'auth.callback.completed', result, result.outcome === 'failed' ? 'warn' : 'info')
}

/**
 * Exchanges the B2C authorization code for tokens, validates the `id_token`,
 * extracts the sub-provider from the B2C `idp` claim, and writes all tokens to
 * the session. The browser never sees a token — only the post-login redirect.
 */
async function processCallback(request: FastifyRequest, reply: FastifyReply): Promise<CallbackResult> {
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
      // own action and stays silent. A cancel is also routine — the event is
      // info for it, which keeps it out of warn-based alerting; real provider
      // errors are `failed` and log at warn.
      const cancelled = err.error === 'access_denied'
      reply.redirect(cancelled ? '/' : '/?signInError=provider')
      return cancelled ? { outcome: 'cancelled' } : { outcome: 'failed', errorType: err.error }
    }
    throw err
  }

  const claims = tokens.claims() // undefined when no id_token is present

  if (typeof claims?.email !== 'string' || !claims.email) {
    reply.status(400).send({ error: 'token_missing_email_claim' })
    return { outcome: 'failed', errorType: 'token_missing_email_claim' }
  }

  const subProvider = subProviderFromIdpClaim(claims.idp)
  if (subProvider === 'unknown') {
    request.log.warn({ idp: subProvider, idpClaim: claims.idp ?? null }, '[auth] id_token idp claim is missing or unrecognised')
  }

  // regenerate() empties the session, so read returnTo first.
  const returnTo = request.session.returnTo ?? '/'

  await establishSession(request, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    // v6 exposes expires_in (seconds from now) via the expiresIn() helper —
    // there is no expires_at on the token response.
    tokenExpiry: Math.floor(Date.now() / 1000) + (tokens.expiresIn() ?? 0),
    userId: claims.email,
    idp: subProvider,
  })

  reply.redirect(returnTo)
  return { outcome: 'succeeded' }
}
