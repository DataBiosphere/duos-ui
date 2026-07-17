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
    headers: {
      'Authorization': `Bearer ${request.session.accessToken}`,
      'Accept': 'application/json',
      'X-App-ID': 'DUOS',
    },
  })

  if (res.status === 401) {
    // The upstream API is the source of truth for token validity — a session
    // whose access token it now rejects (expired, revoked) is dead weight.
    await request.session.destroy()
    reply.status(401).send({ authenticated: false })
    return
  }

  if (!res.ok) {
    // A non-401 failure (5xx, upstream outage) says nothing about whether the
    // token itself is still valid — don't destroy the session or parse an
    // error body as if it were a user profile.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  const user = await res.json()
  reply.send({
    authenticated: true,
    user,
    idp: request.session.idp, // 'google' | 'microsoft'
  })
}
