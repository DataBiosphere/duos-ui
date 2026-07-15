import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireEnv } from './oidcClient.js'

/**
 * Confirms the user is authenticated against the upstream Consent API.
 * Returns safe user-profile fields and the active sub-provider — never the
 * tokens themselves, which stay server-side in the session.
 */
export async function getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.session.accessToken) {
    reply.status(401).send({ authenticated: false })
    return
  }

  const res = await fetch(`${requireEnv('DUOS_API_URL')}/api/user/me`, {
    headers: { Authorization: `Bearer ${request.session.accessToken}` },
  })

  if (res.status === 401) {
    // The upstream API is the source of truth for token validity — a session
    // whose access token it now rejects (expired, revoked) is dead weight.
    await request.session.destroy()
    reply.status(401).send({ authenticated: false })
    return
  }

  const user = await res.json()
  reply.send({
    authenticated: true,
    user,
    idp: request.session.idp, // 'google' | 'microsoft'
  })
}
