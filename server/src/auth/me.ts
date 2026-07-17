import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireEnv } from './oidcClient.js'

const UPSTREAM_TIMEOUT_MS = 5000

/**
 * Confirms the user is authenticated against the upstream Consent API.
 * Forwards the upstream user profile and the active sub-provider — never the
 * tokens themselves, which stay server-side in the session.
 */
export async function getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.session.accessToken) {
    reply.status(401).send({ authenticated: false })
    return
  }

  const url = `${requireEnv('DUOS_API_URL')}/api/user/me`

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${request.session.accessToken}`,
        'Accept': 'application/json',
        'X-App-ID': 'DUOS',
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  }
  catch {
    // Network failure or timeout — same as any other upstream outage below:
    // says nothing about the token's validity, so don't destroy the session.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  if (res.status === 401) {
    // The upstream API is the source of truth for token validity — a session
    // whose access token it now rejects (expired, revoked) is dead weight.
    await request.session.destroy()
    reply.clearCookie('sessionId').status(401).send({ authenticated: false })
    return
  }

  if (!res.ok) {
    // A non-401 failure (5xx, upstream outage) says nothing about whether the
    // token itself is still valid — don't destroy the session or parse an
    // error body as if it were a user profile.
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  let user: unknown
  try {
    user = await res.json()
  }
  catch {
    reply.status(502).send({ authenticated: false, error: 'upstream_unavailable' })
    return
  }

  reply.send({
    authenticated: true,
    user,
    idp: request.session.idp, // 'google' | 'microsoft'
  })
}
