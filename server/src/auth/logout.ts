import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig } from './oidcClient.js'

/**
 * Stamps the audit record, attempts token revocation (if B2C exposes a
 * revocation endpoint), destroys the session, and clears the cookie. Session
 * destruction is the primary logout control in the BFF model — revocation is
 * best-effort on top of it.
 */
export async function handleLogout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Revocation is best-effort on top of session destruction (the primary
  // logout control below) — a discovery failure here (network blip, missing
  // Azure env var) must not stop logout from completing.
  try {
    const config = await getOidcConfig()

    // B2C does not reliably expose a revocation_endpoint in its discovery
    // document, so revocation is typically skipped here. v6: the endpoint is
    // read from config.serverMetadata(), and revocation is tokenRevocation().
    if (config.serverMetadata().revocation_endpoint) {
      if (request.session.accessToken) {
        await oidc.tokenRevocation(config, request.session.accessToken).catch(() => {})
      }
      if (request.session.refreshToken) {
        await oidc.tokenRevocation(config, request.session.refreshToken).catch(() => {})
      }
    }
  }
  catch {
    // getOidcConfig() failed — skip revocation and fall through to session
    // destruction below.
  }

  // user_session_audit + its sid_hash-keyed triggers are Epic 1 infrastructure
  // (DT-3606) — the same hashing convention as the INSERT trigger there, so
  // this UPDATE targets the row that trigger created for this sid.
  await request.server.pg.query(
    `UPDATE user_session_audit
        SET end_reason = 'logout'
      WHERE sid_hash = encode(sha256($1::bytea), 'hex') AND ended_at IS NULL`,
    [request.session.sessionId],
  )

  await request.session.destroy()
  reply.clearCookie('sessionId').status(204).send()
}
