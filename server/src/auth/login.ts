import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig, pkce, requireEnv } from './oidcClient.js'

/**
 * Open-redirect guard for the post-login redirect target: accept only
 * same-origin absolute paths, falling back to '/'. Requiring a leading '/'
 * and then parsing against a fixed base catches every classic bypass in one
 * origin comparison — 'https://evil.com' (absolute URL), '//evil.com'
 * (protocol-relative), '/\evil.com' (WHATWG URL parsing treats '\' as '/'),
 * and encoded or control-character variants — because the parser normalizes
 * them all before the check. Returning the parsed path also re-serializes
 * any '../' segments.
 */
const RETURN_TO_BASE = 'https://returnto.invalid'
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/'
  try {
    const url = new URL(value, RETURN_TO_BASE)
    if (url.origin !== RETURN_TO_BASE) return '/'
    return url.pathname + url.search + url.hash
  }
  catch {
    return '/'
  }
}

/**
 * Generates PKCE parameters, stores them in the session, and returns the B2C
 * authorization URL. The browser never sees the verifier — only the redirect
 * URL, which the client navigates to directly.
 */
export async function handleLogin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const config = await getOidcConfig()
  const verifier = pkce.verifier()
  const state = pkce.state()

  request.session.pkceVerifier = verifier
  request.session.pkceState = state
  request.session.returnTo = safeReturnTo((request.query as Record<string, unknown>).returnTo)

  // v6: redirect_uri is a per-call parameter (Configuration does not hold
  // redirect_uris), and the PKCE challenge calculation is async.
  const redirectUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: requireEnv('DUOS_OAUTH_REDIRECT_URI'),
    // See oidcClient.ts's B2C scope quirk note: DUOS_AZURE_CLIENT_ID must be
    // in the scope string, or B2C returns an id_token with no access_token.
    scope: `openid email profile offline_access ${requireEnv('DUOS_AZURE_CLIENT_ID')}`,
    code_challenge: await pkce.challenge(verifier),
    code_challenge_method: 'S256',
    state,
    // Force the B2C login screen even when B2C still holds an SSO cookie.
    // /auth/logout destroys only the BFF session — without this, a signed-out
    // user clicking Sign In is silently re-authenticated by B2C's own session,
    // which matters on shared workstations (DUOS gates dbGaP data). The legacy
    // client forced the same thing via oidcBroker's `prompt: 'consent login'`.
    // True B2C session termination (front-channel logout) is epic-5, 5-I.
    prompt: 'login',
  })

  // Persist the session BEFORE responding, so @fastify/session's async onSend
  // save (pgStore.set) isn't in flight when this async handler
  // resolves — otherwise Fastify's wrapThenable fires a second reply.send() and
  // the duplicate session write crashes with ERR_HTTP_HEADERS_SENT. See the
  // fuller note in callback.ts. (This race is why /auth/login was flaky.)
  await request.session.save()

  reply.send({ redirectUrl: redirectUrl.href }) // buildAuthorizationUrl returns a URL
}
