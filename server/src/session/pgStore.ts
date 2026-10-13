import type { SessionStore } from '@fastify/session'
import type { FastifyBaseLogger, Session } from 'fastify'
import type { PostgresDb } from '@fastify/postgres'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

/**
 * A thin `@fastify/session` store backed by the `user_sessions` Postgres table.
 *
 * Implements the typed `SessionStore` interface (get/set/destroy) directly
 * against `app.pg` — no Express compatibility shim, and no `touch`:
 * `@fastify/session` only re-saves via `set` when the session data changes
 * (`rolling` is off — see index.ts) and never calls `touch`.
 *
 * Correctness never depends on the `pg_cron` cleanup job: `get` filters on
 * `expire > NOW()`, so expired rows are invisible even before they are purged.
 */
export function createPgSessionStore(pg: PostgresDb, log: Pick<FastifyBaseLogger, 'info' | 'error'>): SessionStore {
  // Expiry is computed in SQL from the same clock `get` filters with
  // (`expire > NOW()`), so drift between the Node container's clock and
  // Postgres's cannot shorten or extend sessions. `@fastify/session` types
  // `cookie.maxAge` as nullable, and a non-positive value would write an
  // already-expired row — both fall back to the default.
  const maxAgeMs = (session: Session): number => {
    const maxAge = session.cookie.maxAge
    return typeof maxAge === 'number' && maxAge > 0 ? maxAge : EIGHT_HOURS_MS
  }

  // Uniform bridge from promise-returning work to the store's callback
  // contract, so error handling is identical across methods by construction.
  // It is also where `session_store.completed` is emitted, one event per
  // operation, so all three methods are covered by construction too. The store
  // has no request, so `idp` is always `unknown`.
  const run = <T>(op: 'get' | 'set' | 'destroy', callback: (err?: unknown, result?: T) => void, work: () => Promise<T>): void => {
    work().then(
      (result) => {
        log.info({ event: 'session_store.completed', op, outcome: 'ok', idp: 'unknown' }, 'session_store.completed')
        callback(null, result)
      },
      (err: unknown) => {
        log.error({ event: 'session_store.completed', op, outcome: 'failed', idp: 'unknown', err }, 'session_store.completed')
        callback(err)
      },
    )
  }

  return {
    get: (sid, callback) => run('get', callback, async () => {
      const { rows } = await pg.query(
        'SELECT sess FROM user_sessions WHERE sid = $1 AND expire > NOW()',
        [sid],
      )
      return rows[0]?.sess ?? null
    }),

    set: (sid, session, callback) => run('set', callback, async () => {
      await pg.query(
        `INSERT INTO user_sessions (sid, sess, expire)
         VALUES ($1, $2, NOW() + $3 * interval '1 millisecond')
         ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = NOW() + $3 * interval '1 millisecond'`,
        [sid, session, maxAgeMs(session)],
      )
    }),

    destroy: (sid, callback) => run('destroy', callback, async () => {
      await pg.query('DELETE FROM user_sessions WHERE sid = $1', [sid])
    }),
  } satisfies SessionStore
}
