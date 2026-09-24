import type { FastifyRequest, Session } from 'fastify'

type SessionFields = Pick<Session, 'accessToken' | 'refreshToken' | 'idToken' | 'tokenExpiry' | 'userId' | 'idp' | 'testFixture'>

/**
 * Rotates the session ID (fixation protection, story 5-C), then writes the
 * signed-in fields. Every sign-in path goes through here.
 */
export async function establishSession(request: FastifyRequest, fields: SessionFields): Promise<void> {
  const preAuthSid = request.session.sessionId
  // regenerate() replaces the session with an empty one, so write fields after it.
  await request.session.regenerate()
  Object.assign(request.session, fields)
  // Avoid an async onSend save racing Fastify's reply lifecycle.
  await request.session.save()
  await retirePreAuthSession(request, preAuthSid)
}

/** Best-effort audit and cleanup after a successful session rotation. */
export async function retirePreAuthSession(request: FastifyRequest, preAuthSid: string): Promise<void> {
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
