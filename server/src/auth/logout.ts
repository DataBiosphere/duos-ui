import * as oidc from 'openid-client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getOidcConfig, requireEnv } from './oidcClient.js'

/**
 * Builds the B2C RP-initiated logout (end-session) URL — best-effort.
 *
 * Every step can throw: discovery can fail, `requireEnv` throws on a missing
 * DUOS_POST_LOGOUT_REDIRECT_URI, and `buildEndSessionUrl` throws when the B2C
 * discovery document exposes no `end_session_endpoint`. A logout must never
 * fail because single sign-out could not be arranged, so a failure here logs
 * and returns undefined — the caller then answers 204 and the client performs
 * a local-only logout.
 *
 * The server is the trust boundary for this URL: the browser cannot validate
 * it (the B2C origin is server-only configuration), so the URL always comes
 * from the configured discovery document, and outside development it must be
 * HTTPS. buildEndSessionUrl (openid-client v6) adds client_id itself — the URL
 * is never assembled by hand.
 */
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

/** Best-effort token revocation. B2C rarely exposes a revocation_endpoint. */
async function revokeTokens(request: FastifyRequest): Promise<void> {
  // Revocation is best-effort on top of session destruction (the primary
  // logout control) — a discovery failure here (network blip, missing Azure
  // env var) must not stop logout from completing.
  try {
    const config = await getOidcConfig()

    // B2C does not reliably expose a revocation_endpoint in its discovery
    // document, so revocation is typically skipped here. v6: the endpoint is
    // read from config.serverMetadata(), and revocation is tokenRevocation().
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
  catch {
    // getOidcConfig() failed — skip revocation; the caller still destroys the
    // session below.
  }
}

/** Best-effort audit stamp. */
async function stampAuditRecord(request: FastifyRequest): Promise<void> {
  // Best-effort, like revocation — the audit trail is the least critical step
  // here, so a transient DB error must not leave the session (and its cookie)
  // alive.
  try {
    // user_session_audit + its sid_hash-keyed triggers are Epic 1
    // infrastructure (DT-3606) — the same hashing convention as the INSERT
    // trigger there, so this UPDATE targets the row that trigger created for
    // this sid.
    await request.server.pg.query(
      `UPDATE user_session_audit
          SET end_reason = 'logout'
        WHERE sid_hash = encode(sha256($1::bytea), 'hex') AND ended_at IS NULL`,
      [request.session.sessionId],
    )
  }
  catch {
    // Audit write failed — the caller still destroys the session below.
  }
}

/**
 * Stamps the audit record, attempts token revocation (if B2C exposes a
 * revocation endpoint), destroys the session, and clears the cookie. Session
 * destruction is the primary logout control in the BFF model — revocation is
 * best-effort on top of it.
 *
 * Front-channel logout (Epic 5, story 5-E): the BFF session is only half the
 * problem — the browser also holds Azure B2C's own SSO cookie. Because the
 * client calls this endpoint with `fetch` rather than a top-level navigation,
 * the server cannot redirect the browser itself, so it returns the end-session
 * URL and the client navigates, mirroring /auth/login's `{ redirectUrl }`
 * shape. Only two answers are possible, and the client treats anything else as
 * an unconfirmed logout:
 *   - 200 `{ redirectUrl }` — navigate to B2C to end its session too
 *   - 204 — the BFF session is destroyed; no single sign-out was arranged
 */
export async function handleLogout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Captured before any destruction: the id_token_hint dies with the session.
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
