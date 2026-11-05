import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PostgresDb } from '@fastify/postgres'
import { createPgSessionStore } from '../src/session/pgStore.js'

// ---------------------------------------------------------------------------
// A minimal fake `app.pg` whose `query` is a vitest mock. createPgSessionStore
// only ever touches `pg.query`, so this is all the surface area we need.
// ---------------------------------------------------------------------------
function makeFakePg() {
  const query = vi.fn()
  return { pg: { query } as unknown as PostgresDb, query }
}

// The store methods are callback-based; wrap them so tests can await a result.
function promisifyGet(
  store: ReturnType<typeof createPgSessionStore>,
  sid: string,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    store.get(sid, (err, session) => (err ? reject(err) : resolve(session)))
  })
}

function promisifyVoid(
  fn: (cb: (err?: unknown) => void) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(err => (err ? reject(err) : resolve()))
  })
}

const sampleSession = {
  cookie: { originalMaxAge: null, maxAge: 8 * 60 * 60 * 1000 },
  userId: 'user@example.com',
  idp: 'google',
} as never

describe('createPgSessionStore', () => {
  let pg: PostgresDb
  let query: ReturnType<typeof vi.fn>
  let store: ReturnType<typeof createPgSessionStore>
  let log: { info: ReturnType<typeof vi.fn>, error: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    const fake = makeFakePg()
    pg = fake.pg
    query = fake.query
    log = { info: vi.fn(), error: vi.fn() }
    store = createPgSessionStore(pg, log as never)
  })

  describe('get', () => {
    it('returns the stored session and filters on expire > NOW()', async () => {
      query.mockResolvedValueOnce({ rows: [{ sess: sampleSession }] })

      const result = await promisifyGet(store, 'sid-1')

      expect(result).toEqual(sampleSession)
      const [sql, params] = query.mock.calls[0]
      expect(sql).toContain('SELECT sess FROM user_sessions')
      expect(sql).toContain('expire > NOW()')
      expect(params).toEqual(['sid-1'])
    })

    it('returns a regenerated row, whose generation @fastify/session 11.1.6 checks itself', async () => {
      query.mockResolvedValueOnce({ rows: [] })

      await promisifyGet(store, 'sid-1')

      const [sql] = query.mock.calls[0]
      expect(sql).not.toContain('__fastifySessionMetadata')
    })

    it('returns null when no (unexpired) row exists', async () => {
      query.mockResolvedValueOnce({ rows: [] })
      expect(await promisifyGet(store, 'missing')).toBeNull()
    })

    it('propagates query errors to the callback', async () => {
      query.mockRejectedValueOnce(new Error('db down'))
      await expect(promisifyGet(store, 'sid-1')).rejects.toThrow('db down')
    })
  })

  describe('set', () => {
    it('upserts sid/sess with an expiry computed in SQL from cookie.maxAge', async () => {
      query.mockResolvedValueOnce({ rows: [] })

      await promisifyVoid(cb => store.set('sid-1', sampleSession, cb))

      const [sql, params] = query.mock.calls[0]
      expect(sql).toContain('INSERT INTO user_sessions')
      expect(sql).toContain('ON CONFLICT (sid) DO UPDATE')
      // The expiry is NOW() + maxAge evaluated by Postgres, so writes use the
      // same clock `get` filters with (`expire > NOW()`) — container/DB clock
      // drift cannot shorten or extend sessions.
      expect(sql).toContain(`NOW() + $3 * interval '1 millisecond'`)
      // An upsert never overwrites a row that 11.1.6 has regenerated.
      expect(sql).toContain(`WHERE COALESCE(user_sessions.sess->'__fastifySessionMetadata'->>'generation', user_sessions.sid) = user_sessions.sid`)
      expect(params).toEqual(['sid-1', sampleSession, 8 * 60 * 60 * 1000])
    })

    it.each([null, 0, -1])('falls back to the 8h default when cookie.maxAge is %s', async (maxAge) => {
      query.mockResolvedValueOnce({ rows: [] })
      const session = { cookie: { originalMaxAge: null, maxAge } } as never

      await promisifyVoid(cb => store.set('sid-1', session, cb))

      const [, params] = query.mock.calls[0]
      expect(params[2]).toBe(8 * 60 * 60 * 1000)
    })

    it('propagates query errors to the callback', async () => {
      query.mockRejectedValueOnce(new Error('write failed'))
      await expect(
        promisifyVoid(cb => store.set('sid-1', sampleSession, cb)),
      ).rejects.toThrow('write failed')
    })
  })

  describe('compareAndSet', () => {
    it('updates the row only when it is unexpired and holds the expected generation', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await promisifyVoid(cb => store.compareAndSet('sid-1', 'gen-1', sampleSession, cb))

      const [sql, params] = query.mock.calls[0]
      expect(sql).toContain('UPDATE user_sessions')
      expect(sql).not.toContain('INSERT')
      expect(sql).toContain('expire > NOW()')
      // Rows written before @fastify/session 11.1.6 have no generation; theirs is the sid.
      expect(sql).toContain(`COALESCE(user_sessions.sess->'__fastifySessionMetadata'->>'generation', user_sessions.sid) = $2`)
      expect(sql).toContain(`NOW() + $4 * interval '1 millisecond'`)
      expect(params).toEqual(['sid-1', 'gen-1', sampleSession, 8 * 60 * 60 * 1000])
    })

    it('reports ENOENT when no row matched, so a destroyed session is not written back', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const err = await promisifyVoid(cb => store.compareAndSet('sid-1', 'gen-1', sampleSession, cb)).catch((e: unknown) => e)

      expect(err).toBeInstanceOf(Error)
      expect((err as { code?: unknown }).code).toBe('ENOENT')
      expect(query).toHaveBeenCalledOnce()
    })

    it('propagates query errors to the callback', async () => {
      query.mockRejectedValueOnce(new Error('write failed'))
      await expect(
        promisifyVoid(cb => store.compareAndSet('sid-1', 'gen-1', sampleSession, cb)),
      ).rejects.toThrow('write failed')
    })
  })

  describe('destroy', () => {
    it('deletes the row for the given sid', async () => {
      query.mockResolvedValueOnce({ rows: [] })

      await promisifyVoid(cb => store.destroy('sid-1', cb))

      const [sql, params] = query.mock.calls[0]
      expect(sql).toContain('DELETE FROM user_sessions WHERE sid = $1')
      expect(params).toEqual(['sid-1'])
    })

    it('propagates query errors to the callback', async () => {
      query.mockRejectedValueOnce(new Error('delete failed'))
      await expect(
        promisifyVoid(cb => store.destroy('sid-1', cb)),
      ).rejects.toThrow('delete failed')
    })
  })

  describe('session_store.completed', () => {
    it.each([
      ['get', () => promisifyGet(store, 'sid-1')],
      ['set', () => promisifyVoid(cb => store.set('sid-1', sampleSession, cb))],
      ['compareAndSet', () => promisifyVoid(cb => store.compareAndSet('sid-1', 'gen-1', sampleSession, cb))],
      ['destroy', () => promisifyVoid(cb => store.destroy('sid-1', cb))],
    ])('emits one ok event at info for a successful %s', async (op, call) => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await call()

      expect(log.info).toHaveBeenCalledOnce()
      expect(log.info).toHaveBeenCalledWith(
        { event: 'session_store.completed', op, outcome: 'ok', idp: 'unknown' },
        'session_store.completed',
      )
      expect(log.error).not.toHaveBeenCalled()
    })

    it('emits one failed event at error, carrying the error, when the query rejects', async () => {
      const failure = new Error('connection terminated')
      query.mockRejectedValueOnce(failure)

      await expect(promisifyGet(store, 'sid-1')).rejects.toThrow('connection terminated')

      expect(log.error).toHaveBeenCalledOnce()
      expect(log.error).toHaveBeenCalledWith(
        { event: 'session_store.completed', op: 'get', outcome: 'failed', idp: 'unknown', err: failure },
        'session_store.completed',
      )
      expect(log.info).not.toHaveBeenCalled()
    })

    it('emits a conflict at info, not a failure, when compareAndSet finds the session changed', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(
        promisifyVoid(cb => store.compareAndSet('sid-1', 'gen-1', sampleSession, cb)),
      ).rejects.toMatchObject({ code: 'ENOENT' })

      expect(log.info).toHaveBeenCalledOnce()
      expect(log.info).toHaveBeenCalledWith(
        { event: 'session_store.completed', op: 'compareAndSet', outcome: 'conflict', idp: 'unknown' },
        'session_store.completed',
      )
      expect(log.error).not.toHaveBeenCalled()
    })

    it('never puts the sid in the event', async () => {
      query.mockResolvedValueOnce({ rows: [] })

      await promisifyGet(store, 'SECRET-SID')

      expect(JSON.stringify(log.info.mock.calls)).not.toContain('SECRET-SID')
    })
  })
})
