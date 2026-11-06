import type { SessionStore } from '@fastify/session'
import type { FastifyBaseLogger, Session } from 'fastify'
import type { PostgresDb } from '@fastify/postgres'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

/**
 * Where `@fastify/session` 11.1.6 keeps a session's generation. Rows written
 * before that version have none, and then the generation is the sid.
 */
const GENERATION = `COALESCE(user_sessions.sess->'__fastifySessionMetadata'->>'generation', user_sessions.sid)`

/**
 * A stored session's generation, as `@fastify/session` 11.1.6 reads it: the
 * sid for a session written before 11.1.6, which has no generation.
 */
export const sessionGeneration = (stored: object, sid: string): string =>
  (stored as { __fastifySessionMetadata?: { generation?: unknown } }).__fastifySessionMetadata?.generation as string | undefined ?? sid

/**
 * What a generation-checked destroy found: it deleted the row, the row was
 * already gone, or a later sign-in now holds it and it was left alone.
 */
export type DestroyOutcome = 'destroyed' | 'gone' | 'superseded'

/** Destroys a session's row only while it still holds that generation (DT-4420). */
export type DestroyGeneration = (sid: string, generation: string, callback: (err?: unknown, outcome?: DestroyOutcome) => void) => void

/** The store the BFF registers: `@fastify/session`'s contract plus the generation-checked destroy. */
export type PgSessionStore = SessionStore & { destroyGeneration: DestroyGeneration }

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
export function createPgSessionStore(pg: PostgresDb, log: Pick<FastifyBaseLogger, 'info' | 'error'>): PgSessionStore {
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
    // Returns regenerated rows too: @fastify/session 11.1.6 checks the
    // cookie's generation against the row's itself. (The 11.1.5 release hid
    // them, so an 11.1.5 pod can't load a session 11.1.6 rotated; DT-4420.)
    get: (sid, callback) => run('get', callback, async () => {
      const { rows } = await pg.query(
        'SELECT sess FROM user_sessions WHERE sid = $1 AND expire > NOW()',
        [sid],
      )
      return rows[0]?.sess ?? null
    }),

    // Never overwrites a regenerated row: an 11.1.5 pod that loaded the
    // pre-auth session before a sign-in must not write it back over the
    // signed-in one. In 11.1.6, `set` is only for new sessions.
    set: (sid, session, callback) => run('set', callback, async () => {
      await pg.query(
        `INSERT INTO user_sessions (sid, sess, expire)
         VALUES ($1, $2, NOW() + $3 * interval '1 millisecond')
         ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = NOW() + $3 * interval '1 millisecond'
         WHERE ${GENERATION} = user_sessions.sid`,
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

    // The DELETE checks the generation atomically. If it removes nothing, a
    // fresh read tells a later sign-in (the row is still there) from a row a
    // concurrent destroy already removed. One statement can't: a CTE would
    // read the row as it was before that destroy committed.
    destroyGeneration: (sid, generation, callback) => run('destroy', callback, async (): Promise<DestroyOutcome> => {
      const { rowCount } = await pg.query(
        `DELETE FROM user_sessions WHERE sid = $1 AND ${GENERATION} = $2`,
        [sid, generation],
      )
      if (rowCount === 1) return 'destroyed'
      // An unreadable row reads as superseded: the DELETE already showed it
      // isn't this request's, and the caller then leaves the cookie alone.
      const exists = await pg.query('SELECT 1 FROM user_sessions WHERE sid = $1', [sid]).then(
        ({ rows }: { rows: unknown[] }) => rows.length > 0,
        (err: unknown) => {
          // Counted as a failed read in the store error rate, though the destroy answers.
          log.error({ event: 'session_store.completed', op: 'get', outcome: 'failed', idp: 'unknown', err }, 'session_store.completed')
          return true
        },
      )
      return exists ? 'superseded' : 'gone'
    }),
  } satisfies PgSessionStore
}
