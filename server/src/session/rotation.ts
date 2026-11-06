import type { FastifyRequest, Session } from 'fastify'

type SessionFields = Pick<Session, 'accessToken' | 'refreshToken' | 'idToken' | 'tokenExpiry' | 'userId' | 'idp' | 'testFixture'>

/**
 * Rotates the session (fixation protection, story 5-C), then writes the
 * signed-in fields. Every sign-in path goes through here.
 *
 * Since @fastify/session 11.1.6, `regenerate()` keeps the store row and gives
 * the session a new generation, which the new cookie carries. A cookie with the
 * pre-auth generation, such as one an attacker planted, no longer loads the
 * session, so there is no pre-auth row left to destroy. Consent's audit trigger
 * sees the generation change and closes the pre-auth audit row as 'rotated'
 * (changelog-consent-2026-11-05-bff-session-audit-rotation).
 */
export async function establishSession(request: FastifyRequest, fields: SessionFields): Promise<void> {
  // regenerate() replaces the session with an empty one, so write fields after it.
  await request.session.regenerate()
  Object.assign(request.session, fields)
  // Avoid an async onSend save racing Fastify's reply lifecycle.
  await request.session.save()
}
