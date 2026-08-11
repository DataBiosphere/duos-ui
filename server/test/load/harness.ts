import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import { createPgSessionStore } from '../../src/session/pgStore.js'
import { csrfPluginOptions } from '../../src/auth/csrf.js'
import { apiProxy } from '../../src/proxy/apiProxy.js'
// envBool only — index.ts's listen block is guarded on `process.argv[1]`, so
// importing it does not start a server. Imported rather than restated so
// DUOS_DB_SSL cannot mean one thing in production and another under load.
import { envBool } from '../../src/index.js'

/**
 * The BFF under load (story 3-H).
 *
 * Assembled in index.ts's order — Postgres, cookie, session, CSRF, proxy —
 * which is what the proxy's registration check and the hook ordering depend on.
 * Deliberately absent is everything outside a `/duos-api/*` request's path:
 * `@fastify/vite`, the SPA fallback, `/config.json`.
 */

/** Test-only, and outside the proxy prefix so it is never proxied. */
const SEED_PATH = '/__load/seed'

const SESSION_COOKIE = 'sessionId'

export interface SeededSession {
  cookie: string
  /** Valid for this session only — the CSRF secret lives in the session. */
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
  /** Undefined leaves `pg`'s default of 10 — what index.ts deploys today. */
  pgPoolMax?: number
  /** Undefined leaves the proxy's own `UPSTREAM_POOL_CONNECTIONS`. */
  undiciConnections?: number
  /** Overrides `DUOS_DB_HOST`/`DUOS_DB_PORT`, for the relay in `dbLatency.ts`. */
  dbAddress?: { host: string, port: number }
}

export interface LoadTarget {
  origin: string
  seedSessions: (count: number) => Promise<SeededSession[]>
  /** Undefined against the memory store. */
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

/**
 * Proves the database is reachable and has the session table, before any of it
 * can surface as an opaque 500 from the seeding route.
 *
 * Worth its own step because `.env.local`'s `DUOS_DB_*` values describe the
 * route from *inside* a container — `DUOS_DB_HOST=host.docker.internal`, and
 * TLS on by default — while this harness runs on the host, so the first attempt
 * against a compose stack fails for reasons the env vars themselves explain.
 */
async function verifyDatabase(app: FastifyInstance, where: string): Promise<void> {
  try {
    await app.pg.query('SELECT 1 FROM user_sessions LIMIT 1')
  }
  catch (err: unknown) {
    const cause = err instanceof Error ? err.message : String(err)
    const hint = /does not exist/.test(cause)
      // The trap DEVNOTES.md warns about: a compose stack started without a
      // consent dump comes up green with no tables.
      ? 'the database is reachable but has no user_sessions table — load the consent dump, or apply the DDL in server/test/load/README.md'
      : `could not reach Postgres at ${where} — running on the host, DUOS_DB_HOST must be a hostname the host can resolve (localhost, not host.docker.internal) and DUOS_DB_SSL=false unless that Postgres speaks TLS`
    throw new Error(`${hint}. Postgres said: ${cause}`)
  }
}

export async function startLoadTarget(options: LoadTargetOptions): Promise<LoadTarget> {
  // Read by `apiProxy` at registration, so it cannot be passed in.
  process.env.DUOS_API_URL = options.upstreamOrigin

  const app: FastifyInstance = Fastify({ logger: false, trustProxy: 1 })

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
      // Requests that wanted a connection and could not have one.
      waiting: app.pg.pool.waitingCount,
    })
  }

  await app.register(fastifyCookie)
  await app.register(fastifySession, {
    secret: 'a-load-test-session-secret-at-least-32-characters-long',
    store,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' },
    saveUninitialized: false,
    // As index.ts sets it: rolling on would write the row back on every
    // session-bearing request, a workload production does not have.
    rolling: false,
  })
  await app.register(fastifyCsrf, csrfPluginOptions)

  /**
   * Stands in for a completed OAuth flow, writing through the real store.
   * Tokens expire an hour out, well outside `REFRESH_WINDOW_SECONDS`, so no
   * request in a run reaches B2C.
   */
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

  // Tracked so the run can delete exactly the rows it wrote — a real `consent`
  // database is not the harness's to litter, and these would otherwise sit
  // there until their eight-hour expiry.
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
