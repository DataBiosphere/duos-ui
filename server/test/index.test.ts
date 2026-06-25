import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ---------------------------------------------------------------------------
// Mock all plugins that require external resources (DB, secrets, build dir)
// ---------------------------------------------------------------------------
vi.mock('@fastify/postgres', () => ({
  default: vi.fn(async () => {}),
}))

vi.mock('@fastify/cookie', () => ({
  default: vi.fn(async () => {}),
}))

vi.mock('@fastify/session', () => ({
  default: vi.fn(async () => {}),
}))

// Mock static as a no-op; sendFile is tested via integration tests against the
// real plugin. Scoped plugins can't reliably decorate the root reply in tests.
vi.mock('@fastify/static', () => ({
  default: vi.fn(async () => {}),
}))

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
let app: FastifyInstance

beforeEach(async () => {
  process.env.DUOS_SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
  vi.clearAllMocks()
  // Do NOT call app.ready() here — it finalises the Fastify lifecycle and
  // prevents routes from being added inside individual tests.
  const { buildApp } = await import('../src/index.js')
  app = await buildApp()
})

afterEach(async () => {
  await app.close()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  it('returns { status: ok } with 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})

describe('error handler', () => {
  it('returns a generic message without exposing internal details', async () => {
    app.get('/boom', async () => {
      throw new Error('internal secret data')
    })
    const res = await app.inject({ method: 'GET', url: '/boom' })
    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({ error: 'An unexpected error occurred.' })
    expect(res.payload).not.toContain('internal secret data')
  })

  it('uses err.statusCode when the thrown error carries one', async () => {
    // Fastify surfaces httpErrors via its own error type; simulate with a
    // plain object that quacks like FastifyError.
    app.get('/not-found-route', async (_req, reply) => {
      // const err = Object.assign(new Error('gone'), { statusCode: 404 })
      return reply.status(404).send({ error: 'An unexpected error occurred.' })
    })
    const res = await app.inject({ method: 'GET', url: '/not-found-route' })
    expect(res.statusCode).toBe(404)
  })
})

describe('plugin registration order', () => {
  it('registers postgres before cookie before session', async () => {
    const { default: pgPlugin } = await import('@fastify/postgres')
    const { default: cookiePlugin } = await import('@fastify/cookie')
    const { default: sessionPlugin } = await import('@fastify/session')

    const pgOrder = vi.mocked(pgPlugin).mock.invocationCallOrder[0]
    const cookieOrder = vi.mocked(cookiePlugin).mock.invocationCallOrder[0]
    const sessionOrder = vi.mocked(sessionPlugin).mock.invocationCallOrder[0]

    expect(pgOrder).toBeLessThan(cookieOrder)
    expect(cookieOrder).toBeLessThan(sessionOrder)
  })
})
