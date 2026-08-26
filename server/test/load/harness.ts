import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import { createPgSessionStore } from '../../src/session/pgStore.js'
import { csrfPluginOptions } from '../../src/auth/csrf.js'
import { TRUST_PROXY } from '../../src/config.js'
import { apiProxy } from '../../src/proxy/apiProxy.js'
import { envBool } from '../../src/index.js'

const SEED_PATH = '/__load/seed'

const SESSION_COOKIE = 'sessionId'

export interface SeededSession {
  cookie: string
  csrfToken: string
}

export interface PoolSnapshot {
  total: number
  idle: number
  waiting: number
}

export interface LoadTargetOptions {
  upstreamOrigin: string
  store: 'memory' | 'postgres'
  pgPoolMax?: number
  undiciConnections?: number
  dbAddress?: { host: string, port: number }
}

export interface LoadTarget {
  origin: string
  seedSessions: (count: number) => Promise<SeededSession[]>
  poolSnapshot: () => PoolSnapshot | undefined
  close: () => Promise<void>
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is unset but is required to load-test against Postgres — set it in .env.local, or pass --store memory`)
  }
  return value
}

async function verifyDatabase(app: FastifyInstance, where: string): Promise<void> {
  try {
    await app.pg.query('SELECT 1 FROM user_sessions LIMIT 1')
  }
  catch (err: unknown) {
    const cause = err instanceof Error ? err.message : String(err)
    const hint = /does not exist/.test(cause)
      ? 'the database is reachable but has no user_sessions table — load the consent dump, or apply the DDL in server/test/load/README.md'
      : `could not reach Postgres at ${where} — running on the host, DUOS_DB_HOST must be a hostname the host can resolve (localhost, not host.docker.internal) and DUOS_DB_SSL=false unless that Postgres speaks TLS`
    throw new Error(`${hint}. Postgres said: ${cause}`)
  }
}

export async function startLoadTarget(options: LoadTargetOptions): Promise<LoadTarget> {
  process.env.DUOS_API_URL = options.upstreamOrigin

  const app: FastifyInstance = Fastify({ logger: false, trustProxy: TRUST_PROXY })

  let poolSnapshot: LoadTarget['poolSnapshot'] = () => undefined
  let store: ReturnType<typeof createPgSessionStore> | undefined

  if (options.store === 'postgres') {
    const host = options.dbAddress?.host ?? requireEnv('DUOS_DB_HOST')
    const port = options.dbAddress?.port ?? Number.parseInt(process.env.DUOS_DB_PORT?.trim() || '5432', 10)
    await app.register(fastifyPostgres, {
      host,
      port,
      database: requireEnv('DUOS_DB_NAME'),
      user: requireEnv('DUOS_DB_USER'),
      password: requireEnv('DUOS_DB_PASSWORD'),
      ssl: envBool(process.env.DUOS_DB_SSL, true) ? { rejectUnauthorized: true } : false,
      max: options.pgPoolMax,
    })
    await verifyDatabase(app, `${host}:${port}`)
    store = createPgSessionStore(app.pg)
    poolSnapshot = () => ({
      total: app.pg.pool.totalCount,
      idle: app.pg.pool.idleCount,
      waiting: app.pg.pool.waitingCount,
    })
  }

  await app.register(fastifyCookie)
  await app.register(fastifySession, {
    secret: 'a-load-test-session-secret-at-least-32-characters-long',
    store,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' },
    saveUninitialized: false,
    rolling: false,
  })
  await app.register(fastifyCsrf, csrfPluginOptions)

  app.post(SEED_PATH, async (request, reply) => {
    Object.assign(request.session, {
      userId: `load-user-${request.session.sessionId}`,
      accessToken: `load-access-token-${request.session.sessionId}`,
      refreshToken: `load-refresh-token-${request.session.sessionId}`,
      tokenExpiry: Math.floor(Date.now() / 1000) + 3600,
      idp: 'microsoft',
    })
    const csrfToken = reply.generateCsrf()
    await request.session.save()
    return reply.send({ csrfToken, sid: request.session.sessionId })
  })

  await app.register(apiProxy, { undiciConnections: options.undiciConnections })

  const origin = await app.listen({ port: 0, host: '127.0.0.1' })

  // Delete only sessions created by this run.
  const seededSids: string[] = []

  return {
    origin,
    poolSnapshot,
    seedSessions: async (count) => {
      const sessions: SeededSession[] = []
      for (let i = 0; i < count; i += 1) {
        const response = await fetch(`${origin}${SEED_PATH}`, { method: 'POST' })
        if (!response.ok) {
          throw new Error(`seeding session ${i} failed with ${response.status}: ${await response.text()}`)
        }
        const setCookie = response.headers.getSetCookie()
          .find(header => header.startsWith(`${SESSION_COOKIE}=`))
        if (!setCookie) {
          throw new Error(`seeding session ${i} returned no ${SESSION_COOKIE} cookie`)
        }
        const { csrfToken, sid } = await response.json() as { csrfToken: string, sid: string }
        seededSids.push(sid)
        sessions.push({ cookie: setCookie.split(';')[0], csrfToken })
      }
      return sessions
    },
    close: async () => {
      if (options.store === 'postgres' && seededSids.length > 0) {
        await app.pg.query('DELETE FROM user_sessions WHERE sid = ANY($1::text[])', [seededSids])
      }
      await app.close()
    },
  }
}
