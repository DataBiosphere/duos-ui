import Fastify, { FastifyError, FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyPostgres from '@fastify/postgres'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BUILD_DIR = path.join(import.meta.dirname, '..', '..', 'build')

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: { level: process.env.FASTIFY_LOG_LEVEL ?? 'info' } })

  // 1. DB pool — must be registered before session so app.pg is available to the store
  await fastify.register(fastifyPostgres, {
    host: process.env.DUOS_DB_HOST,
    database: process.env.DUOS_DB_NAME,
    port: Number.parseInt(process.env.DUOS_DB_PORT ?? '5432', 10),
    user: process.env.DUOS_DB_USER,
    password: process.env.DUOS_DB_PASSWORD,
    ssl: { rejectUnauthorized: true },
  })

  // 2. Cookie + session — store: createPgSessionStore(fastify.pg) wired in next story
  await fastify.register(fastifyCookie)
  await fastify.register(fastifySession, {
    secret: process.env.DUOS_SESSION_SECRET!,
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

  // Health check — registered before static middleware so it always resolves
  fastify.get('/health', async () => ({ status: 'ok' }))

  // Serve the React build as static files
  await fastify.register(fastifyStatic, { root: BUILD_DIR, wildcard: false })

  // SPA fallback — any route not matched above serves index.html
  fastify.setNotFoundHandler((_req, reply) => {
    return reply.sendFile('index.html')
  })

  // Error handler — suppresses stack traces from responses
  fastify.setErrorHandler((err: FastifyError, _req, reply) => {
    fastify.log.error({ err }, '[server] Unhandled error:')
    return reply.status(err.statusCode ?? 500).send({ error: 'An unexpected error occurred.' })
  })

  return fastify
}

// Only start the server when this file is the direct entry point, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = Number(process.env.PORT) || 8080
  try {
    const fastify = await buildApp()
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
  }
  catch (err: unknown) {
    console.error(err)
    process.exit(1)
  }
}
