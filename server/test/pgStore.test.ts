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

  beforeEach(() => {
    const fake = makeFakePg()
    pg = fake.pg
    query = fake.query
    store = createPgSessionStore(pg)
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
})
