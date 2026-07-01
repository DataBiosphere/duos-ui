import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import open from 'open'
import Fastify, { FastifyError, FastifyInstance } from 'fastify'
import fastifyPostgres from '@fastify/postgres'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { createPgSessionStore } from './session/pgStore.js'
import { isBffEnabled } from './featureFlags.js'
import './types/session.js'
import FastifyVite from '@fastify/vite'

const PROJECT_ROOT = path.join(import.meta.dirname, '..', '..')
const isDev = process.env.NODE_ENV !== 'production'
const isCI = Boolean(process.env.CI || process.env.CYPRESS)
const useHttps = isDev && !isCI

type AppInstance = FastifyInstance<http.Server | https.Server>

export async function buildApp(): Promise<AppInstance> {
  const fastify = (useHttps
    ? Fastify<https.Server>({
        https: {
          key: fs.readFileSync(path.join(PROJECT_ROOT, 'server.key')),
          cert: fs.readFileSync(path.join(PROJECT_ROOT, 'server.crt')),
        },
        logger: { level: process.env.FASTIFY_LOG_LEVEL ?? 'info' },
      })
    : Fastify({ logger: { level: process.env.FASTIFY_LOG_LEVEL ?? 'info' } })
  ) as AppInstance

  // 1. DB pool + session — gated on the BFF_ENABLED feature flag (consent API)
  // so the legacy client-side auth flow can run with no DB/session infra at
  // all until the BFF rollout flips the flag. Fails safe to disabled status.
  if (await isBffEnabled()) {
    // DB pool — must be registered before session so app.pg is available to the store
    await fastify.register(fastifyPostgres, {
      host: process.env.DUOS_DB_HOST,
      database: process.env.DUOS_DB_NAME,
      port: Number.parseInt(process.env.DUOS_DB_PORT ?? '5432', 10),
      user: process.env.DUOS_DB_USER,
      password: process.env.DUOS_DB_PASSWORD,
      // App-level TLS is only used for a direct connection to Cloud SQL. When the
      // BFF reaches Postgres over localhost (a Cloud SQL Proxy sidecar in k8s, or
      // the bundled `db` container in docker-compose) the transport is already
      // plaintext-on-loopback, so SSL must be off or the connection is rejected.
      ssl: process.env.DUOS_DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    })

    // Cookie + session — the store reads fastify.pg registered above
    await fastify.register(fastifyCookie)
    await fastify.register(fastifySession, {
      secret: process.env.DUOS_SESSION_SECRET!,
      store: createPgSessionStore(fastify.pg),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.DUOS_SESSION_MAX_AGE_MS) || 8 * 60 * 60 * 1000,
        path: '/',
      },
      saveUninitialized: false,
      rolling: true,
    })
  }

  // Health check — registered before Vite middleware so it always resolves
  fastify.get('/health', async () => ({ status: 'ok' }))

  // Vite: dev → HMR middleware; prod → serves static build + SPA fallback
  await fastify.register(FastifyVite, {
    root: PROJECT_ROOT,
    dev: isDev,
    spa: true,
  })

  await fastify.vite.ready()

  // SPA fallback — @fastify/vite sets up the Vite middleware and reply.html decorator
  // but does not register routes; we wire the catch-all ourselves.
  fastify.setNotFoundHandler((_req, reply) => reply.html())

  // Error handler — suppresses stack traces from responses
  fastify.setErrorHandler((err: FastifyError, _req, reply) => {
    fastify.log.error({ err }, '[server] Unhandled error:')
    return reply.status(err.statusCode ?? 500).send({ error: 'An unexpected error occurred.' })
  })

  return fastify
}

// Only start the server when this file is the direct entry point, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = Number(process.env.PORT) || (isDev ? 3000 : 8080)
  const HOST = '0.0.0.0'
  try {
    const fastify = await buildApp()
    await fastify.listen({ port: PORT, host: HOST })
    if (isDev && !isCI) {
      const protocol = useHttps ? 'https' : 'http'
      await open(`${protocol}://local.dsde-dev.broadinstitute.org:${PORT}`)
    }
  }
  catch (err: unknown) {
    console.error(err)
    process.exit(1)
  }
}
