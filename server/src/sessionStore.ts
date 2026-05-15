import { randomUUID } from 'node:crypto'

interface Session {
  token: string
  expiresAt: number
}

const store = new Map<string, Session>()

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of store) {
    if (session.expiresAt <= now) store.delete(id)
  }
}, 5 * 60 * 1000).unref()

function parseExpiry(token: string): number {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
    if (decoded.exp) return decoded.exp * 1000
  } catch { /* fall through */ }
  return Date.now() + 60 * 60 * 1000
}

export function createSession(token: string): string {
  const sessionId = randomUUID()
  store.set(sessionId, { token, expiresAt: parseExpiry(token) })
  return sessionId
}

export function getSession(sessionId: string): Session | null {
  const session = store.get(sessionId)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    store.delete(sessionId)
    return null
  }
  return session
}

export function deleteSession(sessionId: string): void {
  store.delete(sessionId)
}
