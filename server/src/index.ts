import Fastify, { FastifyError } from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT) || 8080
const BUILD_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'build')

const fastify = Fastify({ logger: true })

async function main(): Promise<void> {
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
    void reply.status(err.statusCode ?? 500).send({ error: 'An unexpected error occurred.' })
  })

  await fastify.listen({ port: PORT, host: '0.0.0.0' })
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
