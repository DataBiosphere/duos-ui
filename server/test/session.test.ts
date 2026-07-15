import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import type { PostgresDb } from '@fastify/postgres'
import { createPgSessionStore } from '../src/session/pgStore.js'
import '../src/types/session.js'

// ---------------------------------------------------------------------------
// In-memory stand-in for the `user_sessions` table. It honours the four SQL
// statements the store issues so the real createPgSessionStore + the real
// @fastify/session middleware can be exercised end-to-end without Postgres.
// A shared `rows` map lets us simulate a server restart (new app, same data).
// ---------------------------------------------------------------------------
function makeInMemoryPg(rows = new Map<string, { sess: unknown, expire: Date }>()) {
  const query = async (sql: string, params: unknown[] = []) => {
    if (sql.includes('SELECT sess FROM user_sessions')) {
      const row = rows.get(params[0] as string)
      return row && row.expire.getTime() > Date.now()
        ? { rows: [{ sess: row.sess }] }
        : { rows: [] }
    }
    if (sql.includes('INSERT INTO user_sessions')) {
      // The real store passes maxAge in ms and lets Postgres compute
      // NOW() + interval; this stand-in plays the role of the DB clock.
      const [sid, sess, maxAgeMs] = params as [string, unknown, number]
      rows.set(sid, { sess, expire: new Date(Date.now() + maxAgeMs) })
      return { rows: [] }
    }
    if (sql.includes('DELETE FROM user_sessions')) {
      rows.delete(params[0] as string)
      return { rows: [] }
    }
    return { rows: [] }
  }
  return { pg: { query } as unknown as PostgresDb, rows }
}

const SECRET = 'test-secret-that-is-at-least-32-characters'

async function buildSessionApp(pg: PostgresDb): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  await app.register(fastifyCookie)
  await app.register(fastifySession, {
    secret: SECRET,
    store: createPgSessionStore(pg),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Strict would strip the cookie from the OAuth callback redirect — see index.ts
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    },
    saveUninitialized: false,
  })

  app.post('/login', async (request) => {
    request.session.userId = 'user@example.com'
    request.session.idp = 'google'
    return { ok: true }
  })

  app.get('/me', async request => ({ userId: request.session.userId ?? null }))

  app.post('/logout', async (request) => {
    await request.session.destroy()
    return { ok: true }
  })

  return app
}

// Pull the session cookie out of an inject response so it can be replayed.
function sessionCookieHeader(res: { cookies: Array<{ name: string, value: string }> }): string {
  const cookie = res.cookies.find(c => c.name === 'sessionId')
  if (!cookie) throw new Error('no session cookie set')
  return `${cookie.name}=${cookie.value}`
}

describe('session middleware (integration)', () => {
  let app: FastifyInstance
  let rows: Map<string, { sess: unknown, expire: Date }>

  beforeEach(async () => {
    const fake = makeInMemoryPg()
    rows = fake.rows
    app = await buildSessionApp(fake.pg)
  })

  afterEach(async () => {
    await app.close()
  })

  it('does not persist a session when nothing is written (saveUninitialized: false)', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ userId: null })
    expect(res.cookies.find(c => c.name === 'sessionId')).toBeUndefined()
    expect(rows.size).toBe(0)
  })

  it('sets an HttpOnly, SameSite=Lax cookie and persists the session on write', async () => {
    const res = await app.inject({ method: 'POST', url: '/login' })
    expect(res.statusCode).toBe(200)

    const cookie = res.cookies.find(c => c.name === 'sessionId')
    expect(cookie).toBeDefined()
    expect(cookie!.httpOnly).toBe(true)
    // Lax, not Strict: the cookie must survive the top-level redirect back
    // from B2C to /auth/callback, which Strict would exclude.
    expect(String(cookie!.sameSite).toLowerCase()).toBe('lax')
    expect(rows.size).toBe(1)
  })

  it('restores session data on a subsequent request carrying the cookie', async () => {
    const login = await app.inject({ method: 'POST', url: '/login' })
    const me = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie: sessionCookieHeader(login) },
    })
    expect(me.json()).toEqual({ userId: 'user@example.com' })
  })

  it('persists across a server restart (new app instance, same backing store)', async () => {
    const login = await app.inject({ method: 'POST', url: '/login' })
    const cookie = sessionCookieHeader(login)

    // Simulate restart: a fresh Fastify app over the SAME rows map + same secret.
    const restarted = await buildSessionApp(makeInMemoryPg(rows).pg)
    const me = await restarted.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie },
    })
    expect(me.json()).toEqual({ userId: 'user@example.com' })
    await restarted.close()
  })

  it('destroys the session on logout', async () => {
    const login = await app.inject({ method: 'POST', url: '/login' })
    const cookie = sessionCookieHeader(login)

    await app.inject({ method: 'POST', url: '/logout', headers: { cookie } })
    expect(rows.size).toBe(0)

    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } })
    expect(me.json()).toEqual({ userId: null })
  })
})
