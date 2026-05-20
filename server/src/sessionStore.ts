import { randomUUID } from 'node:crypto'
import { Redis } from 'ioredis'

// ---------------------------------------------------------------------------
// Redis client (optional) — falls back to in-memory Map when REDIS_URL unset.
// This preserves local-dev and BEE compatibility with no extra infra.
// ---------------------------------------------------------------------------

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    })
  : null

if (redis) {
  redis.on('error', (err: Error) => {
    console.error('[sessionStore] Redis error:', err.message)
  })
}

// ---------------------------------------------------------------------------
// In-memory fallback (single-replica / local dev)
// ---------------------------------------------------------------------------

interface Session {
  token: string
  expiresAt: number
}

const memStore = new Map<string, Session>()

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of memStore) {
    if (session.expiresAt <= now) memStore.delete(id)
  }
}, 5 * 60 * 1000).unref()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseExpiry(token: string): number {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { exp?: number }
    if (decoded.exp) return decoded.exp * 1000
  }
  catch {
    /* fall through */
  }
  return Date.now() + 60 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createSession(token: string): Promise<string> {
  const sessionId = randomUUID()
  const expiresAt = parseExpiry(token)

  if (redis) {
    await redis.hset(`session:${sessionId}`, { token, expiresAt: String(expiresAt) })
    await redis.expireat(`session:${sessionId}`, Math.ceil(expiresAt / 1000))
  }
  else {
    memStore.set(sessionId, { token, expiresAt })
  }

  return sessionId
}

export async function getSession(sessionId: string): Promise<Session | null> {
  if (redis) {
    const data = await redis.hgetall(`session:${sessionId}`)
    if (!data?.token) return null
    const expiresAt = Number(data.expiresAt)
    if (expiresAt <= Date.now()) {
      await redis.del(`session:${sessionId}`)
      return null
    }
    return { token: data.token, expiresAt }
  }

  const session = memStore.get(sessionId)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    memStore.delete(sessionId)
    return null
  }
  return session
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (redis) {
    await redis.del(`session:${sessionId}`)
  }
  else {
    memStore.delete(sessionId)
  }
}
