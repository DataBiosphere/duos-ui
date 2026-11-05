import type { SessionStore } from '@fastify/session'
import type { FastifyBaseLogger, Session } from 'fastify'
import type { PostgresDb } from '@fastify/postgres'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

/**
 * Where `@fastify/session` 11.1.6 keeps a session's generation. Rows written
 * before that version have none, and then the generation is the sid.
 */
const GENERATION = `COALESCE(sess->'__fastifySessionMetadata'->>'generation', sid)`

/**
 * The `compareAndSet` that `@fastify/session` 11.1.6 requires of a store
 * (DT-4420). Until the upgrade, the 11.1.5 `SessionStore` type doesn't declare it.
 */
type CompareAndSet = (sid: string, expectedGeneration: string, session: Session, callback: (err?: unknown) => void) => void

/** The error `compareAndSet` reports when the row is gone, expired or regenerated. */
class SessionChangedError extends Error {
  readonly code = 'ENOENT'
  constructor() {
    super('The session does not exist or has changed')
  }
}

/**
 * A thin `@fastify/session` store backed by the `user_sessions` Postgres table.
 *
 * Implements the typed `SessionStore` interface (get/set/destroy, plus
 * `compareAndSet`) directly against `app.pg` — no Express compatibility shim, and no `touch`:
 * `@fastify/session` only re-saves via `set` when the session data changes
 * (`rolling` is off — see index.ts) and never calls `touch`.
 *
 * Correctness never depends on the `pg_cron` cleanup job: `get` filters on
 * `expire > NOW()`, so expired rows are invisible even before they are purged.
 */
export function createPgSessionStore(pg: PostgresDb, log: Pick<FastifyBaseLogger, 'info' | 'error'>): SessionStore & { compareAndSet: CompareAndSet } {
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
  // operation, so every method is covered by construction too. The store
  // has no request, so `idp` is always `unknown`.
  const run = <T>(op: 'get' | 'set' | 'compareAndSet' | 'destroy', callback: (err?: unknown, result?: T) => void, work: () => Promise<T>): void => {
    work().then(
      (result) => {
        log.info({ event: 'session_store.completed', op, outcome: 'ok', idp: 'unknown' }, 'session_store.completed')
        callback(null, result)
      },
      (err: unknown) => {
        // A lost compareAndSet is the race working as designed, not a store
        // fault, so it stays out of the store error rate (bff-metrics.md).
        if (err instanceof SessionChangedError) {
          log.info({ event: 'session_store.completed', op, outcome: 'conflict', idp: 'unknown' }, 'session_store.completed')
        }
        else {
          log.error({ event: 'session_store.completed', op, outcome: 'failed', idp: 'unknown', err }, 'session_store.completed')
        }
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

    // Replaces the session only if its row still exists, hasn't expired, and
    // holds the generation the request loaded. One UPDATE makes the check and
    // the write atomic, so a save that started before a logout's destroy, or
    // before a sign-in's regenerate, can't bring back or overwrite that row.
    compareAndSet: (sid, expectedGeneration, session, callback) => run('compareAndSet', callback, async () => {
      const { rowCount } = await pg.query(
        `UPDATE user_sessions
            SET sess = $3, expire = NOW() + $4 * interval '1 millisecond'
          WHERE sid = $1 AND expire > NOW() AND ${GENERATION} = $2`,
        [sid, expectedGeneration, session, maxAgeMs(session)],
      )
      if (rowCount !== 1) throw new SessionChangedError()
    }),

    destroy: (sid, callback) => run('destroy', callback, async () => {
      await pg.query('DELETE FROM user_sessions WHERE sid = $1', [sid])
    }),
  } satisfies SessionStore & { compareAndSet: CompareAndSet }
}
