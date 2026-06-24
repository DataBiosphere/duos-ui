import type { SessionStore } from '@fastify/session'
import type { Session } from 'fastify'
import type { PostgresDb } from '@fastify/postgres'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

/**
 * The `SessionStore` contract plus an express-session-style `touch`. The store
 * is assignable to `@fastify/session`'s `store` option (which wants only
 * `SessionStore`); `touch` is exposed for completeness and direct testing.
 */
export type PgSessionStore = SessionStore & {
  touch(sid: string, session: Session, callback: (err?: unknown) => void): Promise<void>
}

/**
 * A thin `@fastify/session` store backed by the `user_sessions` Postgres table.
 *
 * Implements the typed `SessionStore` interface (get/set/destroy) directly
 * against `app.pg` — no Express compatibility shim. A `touch` method is also
 * provided for parity with express-session-style stores; `@fastify/session`
 * itself re-saves via `set` when `rolling` is enabled and never calls `touch`.
 *
 * Correctness never depends on the `pg_cron` cleanup job: `get` filters on
 * `expire > NOW()`, so expired rows are invisible even before they are purged.
 */
export function createPgSessionStore(pg: PostgresDb): PgSessionStore {
  const expiryFromSession = (session: Session) =>
    new Date(Date.now() + (session.cookie.maxAge ?? EIGHT_HOURS_MS))

  return {
    async get(sid, callback) {
      try {
        const { rows } = await pg.query(
          'SELECT sess FROM user_sessions WHERE sid = $1 AND expire > NOW()',
          [sid],
        )
        callback(null, rows[0]?.sess ?? null)
      }
      catch (err) {
        callback(err)
      }
    },

    async set(sid, session, callback) {
      try {
        await pg.query(
          `INSERT INTO user_sessions (sid, sess, expire) VALUES ($1, $2, $3)
           ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3`,
          [sid, session, expiryFromSession(session)],
        )
        callback(null)
      }
      catch (err) {
        callback(err)
      }
    },

    async destroy(sid, callback) {
      try {
        await pg.query('DELETE FROM user_sessions WHERE sid = $1', [sid])
        callback(null)
      }
      catch (err) {
        callback(err)
      }
    },

    async touch(sid, session, callback) {
      try {
        await pg.query(
          'UPDATE user_sessions SET expire = $2 WHERE sid = $1',
          [sid, expiryFromSession(session)],
        )
        callback(null)
      }
      catch (err) {
        callback(err)
      }
    },
  } satisfies PgSessionStore
}
