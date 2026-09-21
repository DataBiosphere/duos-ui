import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig, requireEnv } from './oidcClient.js'

/** Best-effort audit and cleanup after a successful session rotation. */
async function retirePreAuthSession(request: FastifyRequest, preAuthSid: string): Promise<void> {
  // Consent's delete trigger otherwise records the pre-auth session as expired.
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

  // request.session now points at the new session; delete the old SID via the store.
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
 * Maps the B2C `idp` claim to the sub-provider the user chose on the B2C
 * login page. The claim name and values come from the B2C custom policy
 * (terraform-ap-deployments/azure/b2c/policies, TrustFrameworkExtensionsDUOS):
 * the `identityProvider` claim type goes on the wire under the OpenIdConnect
 * partner name `idp`; the Google-OAUTH profile sets it to the literal
 * `google.com`, and the AADCommon-OpenIdConnect profile copies the Entra
 * token's `iss` (an https://login.microsoftonline.com/<tenant>/v2.0 URL).
 * Anything else — including an absent claim — is `unknown`, never a guess.
 */
export function subProviderFromIdpClaim(idp: unknown): 'google' | 'microsoft' | 'unknown' {
  if (idp === 'google.com') return 'google'
  if (typeof idp === 'string' && idp.startsWith('https://login.microsoftonline.com/')) return 'microsoft'
  return 'unknown'
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

  const subProvider = subProviderFromIdpClaim(claims.idp)
  if (subProvider === 'unknown') {
    // A missing dimension drops the sign-in from every provider-split
    // dashboard, so record it as unknown and say so rather than guessing.
    request.log.warn({ idp: claims.idp }, '[auth] id_token idp claim is missing or unrecognised')
  }

  // regenerate() replaces the session with an empty one, so preserve returnTo
  // and write tokens only after rotating the pre-auth SID.
  const preAuthSid = request.session.sessionId
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

  // Avoid an async onSend save racing Fastify's reply lifecycle.
  await request.session.save()

  await retirePreAuthSession(request, preAuthSid)

  reply.redirect(returnTo)
}
