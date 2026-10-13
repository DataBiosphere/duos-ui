import { Writable } from 'node:stream'
import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { buildLoggerOptions, hashValue, sanitizeError, scrubSecrets } from '../src/logging.js'

const BEARER = 'eyJhbGciOiJSUzI1NiJ9.payload.signature'
const CALLBACK_URL = 'https://duos.example/auth/callback?code=SECRET-AUTH-CODE&state=SECRET-STATE'

/** Fastify instance whose logger writes to an in-memory buffer, one parsed JSON object per line. */
function captureLogger() {
  const lines: string[] = []
  const stream = new Writable({
    write(chunk, _enc, done) {
      lines.push(...chunk.toString().split('\n').filter(Boolean))
      done()
    },
  })
  const app = Fastify({ logger: { ...buildLoggerOptions(), level: 'info', stream } })
  return { app, lines, entries: () => lines.map(line => JSON.parse(line) as Record<string, unknown>) }
}

class FakeResponseBodyError extends Error {
  error = 'invalid_grant'
  cause = { error: 'invalid_grant', refresh_token: 'SECRET-REFRESH-TOKEN', access_token: 'SECRET-ACCESS-TOKEN' }
  response = { body: 'SECRET-RESPONSE-BODY' }
  constructor(message: string) {
    super(message)
    this.name = 'ResponseBodyError'
  }
}

describe('logger output', () => {
  let app: ReturnType<typeof captureLogger>['app'] | undefined
  afterEach(async () => {
    await app?.close()
  })

  it('maps pino levels to Cloud Logging severity and writes the text under `message`', async () => {
    const capture = captureLogger()
    app = capture.app
    app.log.info('hello')
    app.log.warn('careful')
    app.log.error('broken')
    const [info, warn, error] = capture.entries()
    expect(info).toMatchObject({ severity: 'INFO', message: 'hello' })
    expect(warn).toMatchObject({ severity: 'WARNING', message: 'careful' })
    expect(error).toMatchObject({ severity: 'ERROR', message: 'broken' })
    expect(info).not.toHaveProperty('level')
    expect(info).not.toHaveProperty('msg')
  })

  it('redacts a session object logged one level down', async () => {
    const capture = captureLogger()
    app = capture.app
    app.log.info({
      session: { sessionId: 'SECRET-SESSION-ID', sid: 'SECRET-SID', userId: 'person@example.org', email: 'person@example.org', accessToken: 'SECRET-ACCESS-TOKEN', refreshToken: 'SECRET-REFRESH-TOKEN', idToken: 'SECRET-ID-TOKEN' },
    }, 'session')
    expect(capture.lines[0]).not.toMatch(/SECRET|person@example\.org/)
  })

  it('redacts top-level credential fields and request credential headers', async () => {
    const capture = captureLogger()
    app = capture.app
    app.log.info({ accessToken: 'SECRET-ACCESS-TOKEN', sid: 'SECRET-SID', email: 'person@example.org', req: { headers: { authorization: `Bearer ${BEARER}`, cookie: 'sid=SECRET-COOKIE' } } }, 'request')
    expect(capture.lines[0]).not.toMatch(/SECRET|person@example\.org|eyJhbGci/)
  })

  it('drops the cause and response of a token-bearing ResponseBodyError', async () => {
    const capture = captureLogger()
    app = capture.app
    app.log.warn({ err: new FakeResponseBodyError('server rejected the grant') }, 'refresh failed')
    expect(capture.lines[0]).not.toMatch(/SECRET/)
    expect(capture.entries()[0].err).toEqual({ type: 'ResponseBodyError', message: 'server rejected the grant', error: 'invalid_grant', stack: expect.stringContaining('server rejected the grant') })
  })

  it('strips a bearer string and a callback `code=` value from an error message', async () => {
    const capture = captureLogger()
    app = capture.app
    app.log.error({ err: new Error(`fetch failed for ${CALLBACK_URL} with Authorization: Bearer ${BEARER}`) }, 'upstream error')
    expect(capture.lines[0]).not.toMatch(/SECRET|eyJhbGci/)
    expect(capture.lines[0]).toContain('code=[REDACTED]')
    expect(capture.lines[0]).toContain('Bearer [REDACTED]')
  })
})

describe('request logging', () => {
  let app: ReturnType<typeof captureLogger>['app'] | undefined
  afterEach(async () => {
    await app?.close()
  })

  it('scrubs the code and state from the automatic request lines of an injected callback', async () => {
    const capture = captureLogger()
    app = capture.app
    app.get('/auth/callback', async () => ({ ok: true }))

    await app.inject({ method: 'GET', url: '/auth/callback?code=SECRET-AUTH-CODE&state=SECRET-STATE&page=2' })

    const requestLines = capture.lines.filter(line => line.includes('/auth/callback'))
    expect(requestLines.length).toBeGreaterThan(0)
    expect(capture.lines.join('\n')).not.toMatch(/SECRET/)
    expect(requestLines[0]).toContain('code=[REDACTED]&state=[REDACTED]&page=2')
  })

  it('scrubs a top-level url field a handler logs itself', async () => {
    const capture = captureLogger()
    app = capture.app

    app.log.info({ url: '/api?token=SECRET-TOKEN' }, 'blocked')

    expect(capture.lines[0]).not.toMatch(/SECRET/)
  })
})

describe('sanitizeError', () => {
  it('keeps name, message, code and the OAuth error field', () => {
    const err = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
    expect(sanitizeError(err)).toEqual({ type: 'Error', message: 'connect ECONNREFUSED', code: 'ECONNREFUSED', stack: expect.stringContaining('logging.test') })
  })

  it('keeps the stack frames but scrubs a secret in the message the stack repeats', () => {
    const err = new Error('fetch failed for https://b2c.example/token?code=SECRET')

    const { stack } = sanitizeError(err) as { stack: string }

    expect(stack).toContain('logging.test')
    expect(stack).not.toContain('SECRET')
  })

  it('wraps a thrown non-Error and scrubs it', () => {
    expect(sanitizeError('token=SECRET failed')).toEqual({ type: 'NonError', message: 'token=[REDACTED] failed' })
  })
})

describe('sanitizeError — cause chain', () => {
  it('keeps the reason a wrapped failure carries in its Error cause', () => {
    const root = Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('getaddrinfo ENOTFOUND b2c.example'), { code: 'ENOTFOUND' }) })

    const out = sanitizeError(root) as { cause: Record<string, unknown> }

    expect(out.cause).toMatchObject({ type: 'Error', message: 'getaddrinfo ENOTFOUND b2c.example', code: 'ENOTFOUND' })
  })

  it('scrubs a secret in a cause message', () => {
    const root = new Error('wrapped', { cause: new Error('GET https://b2c.example/token?code=SECRET failed') })

    expect(JSON.stringify(sanitizeError(root))).not.toContain('SECRET')
  })

  it('drops a cause that is not an Error, as with the body of a token-endpoint error', () => {
    const out = sanitizeError(new FakeResponseBodyError('rejected'))

    expect(out).not.toHaveProperty('cause')
    expect(JSON.stringify(out)).not.toContain('SECRET')
  })

  it('drops a Response cause', () => {
    const out = sanitizeError(new Error('invalid Retry-After', { cause: new Response('SECRET-BODY') }))

    expect(out).not.toHaveProperty('cause')
  })

  it('stops at three levels and survives a cycle', () => {
    const a = new Error('a')
    const b = new Error('b', { cause: a })
    ;(a as { cause?: unknown }).cause = b

    let depth = 0
    for (let node = sanitizeError(a) as { cause?: Record<string, unknown> }; node.cause; node = node.cause as typeof node) depth++

    expect(depth).toBe(3)
  })

  it('keeps a numeric status and a scrubbed, capped error_description', () => {
    const err = Object.assign(new Error('x'), { status: 400, error_description: `AADB2C90091 code=SECRET ${'y'.repeat(500)}` })

    const out = sanitizeError(err) as { status: number, error_description: string }

    expect(out.status).toBe(400)
    expect(out.error_description).not.toContain('SECRET')
    expect(out.error_description.length).toBeLessThanOrEqual(300)
  })
})

describe('scrubSecrets', () => {
  it('leaves unrelated query values alone', () => {
    expect(scrubSecrets('GET /api/dataset?page=2&limit=10')).toBe('GET /api/dataset?page=2&limit=10')
  })
})

describe('hashValue', () => {
  it('matches the audit table digest, hex SHA-256 of the input', () => {
    expect(hashValue('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
