import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig, requireEnv } from './oidcClient.js'

/** Falls back to local logout when a B2C end-session URL cannot be built. */
async function buildEndSessionUrl(request: FastifyRequest, idTokenHint: string | undefined): Promise<string | undefined> {
  if (!idTokenHint) return undefined
  try {
    const config = await getOidcConfig()
    const url = oidc.buildEndSessionUrl(config, {
      id_token_hint: idTokenHint,
      post_logout_redirect_uri: requireEnv('DUOS_POST_LOGOUT_REDIRECT_URI'),
    })
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error(`the discovered end_session_endpoint is not HTTPS (${url.protocol})`)
    }
    return url.href
  }
  catch (err) {
    request.log.error({ err }, '[auth] could not build the B2C end-session URL — falling back to local logout')
    return undefined
  }
}

// One revocation endpoint, because there is one issuer: every session token
// comes from the single B2C token exchange in callback.ts. The session's `idp`
// records which sub-provider the user picked AT B2C — DUOS never holds a
// Google or Microsoft token — so there is no per-provider endpoint to look up
// and no upstream credential to revoke. B2C attempts federated sign-out
// itself; `prompt: 'login'` in login.ts is what guarantees a login screen.
async function revokeTokens(request: FastifyRequest): Promise<void> {
  try {
    const config = await getOidcConfig()

    if (config.serverMetadata().revocation_endpoint) {
      const revocations: Promise<unknown>[] = []
      if (request.session.accessToken) {
        revocations.push(oidc.tokenRevocation(config, request.session.accessToken))
      }
      if (request.session.refreshToken) {
        revocations.push(oidc.tokenRevocation(config, request.session.refreshToken))
      }
      await Promise.all(revocations.map(revocation => revocation.catch(() => {})))
    }
  }
  catch {}
}

async function stampAuditRecord(request: FastifyRequest): Promise<void> {
  try {
    // Match the hash used by the user_session_audit INSERT trigger.
    await request.server.pg.query(
      `UPDATE user_session_audit
          SET end_reason = 'logout'
        WHERE sid_hash = encode(sha256($1::bytea), 'hex') AND ended_at IS NULL`,
      [request.session.sessionId],
    )
  }
  catch {}
}

/**
 * Returns the B2C end-session URL when available; otherwise completes a
 * local-only logout with 204. Revocation and auditing are best-effort.
 */
export async function handleLogout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const idTokenHint = request.session.idToken

  const endSessionUrl = await buildEndSessionUrl(request, idTokenHint)

  await revokeTokens(request)
  await stampAuditRecord(request)

  await request.session.destroy()
  reply.clearCookie('sessionId')

  if (endSessionUrl) {
    reply.status(200).send({ redirectUrl: endSessionUrl })
    return
  }
  reply.status(204).send()
}
