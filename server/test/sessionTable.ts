/**
 * Helpers for the tests' in-memory `user_sessions` tables, so each fake applies
 * the same rules as the SQL in `src/session/pgStore.ts`.
 */

export type SessionRows = Map<string, { sess: unknown, expire: Date }>

/** What the JSON column holds: a copy, not the live Session object. */
export const stored = (sess: unknown): unknown => JSON.parse(JSON.stringify(sess))

/** The generation compareAndSet compares: the sid for rows written before @fastify/session 11.1.6. */
export const sessionGeneration = (sess: unknown, sid: string): string =>
  (sess as { __fastifySessionMetadata?: { generation?: string } }).__fastifySessionMetadata?.generation ?? sid

/**
 * compareAndSet's `UPDATE user_sessions`: writes only an unexpired row that
 * holds the expected generation, and reports how many rows it wrote.
 */
export function compareAndSetRow(rows: SessionRows, params: unknown[]): { rows: never[], rowCount: number } {
  const [sid, expectedGeneration, sess, maxAgeMs] = params as [string, string, unknown, number]
  const row = rows.get(sid)
  if (!row || row.expire.getTime() <= Date.now() || sessionGeneration(row.sess, sid) !== expectedGeneration) {
    return { rows: [], rowCount: 0 }
  }
  rows.set(sid, { sess: stored(sess), expire: new Date(Date.now() + maxAgeMs) })
  return { rows: [], rowCount: 1 }
}
