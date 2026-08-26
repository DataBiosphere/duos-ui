import http from 'node:http'
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import Fastify, { type FastifyInstance, type FastifyRequest, type Session } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import { csrfPluginOptions } from '../src/auth/csrf.js'
import { TRUST_PROXY } from '../src/config.js'

/**
 * The shared harness for the per-upstream proxy suites (apiProxy.test.ts,
 * ecmProxy.test.ts). Extracted so the second suite exercises the second proxy
 * against exactly the same stand-ins as the first — a harness that drifted
 * between the two would let the shared machinery pass one suite and fail the
 * other for harness reasons rather than proxy reasons.
 */

export const nowSeconds = (): number => Math.floor(Date.now() / 1000)

export interface ReceivedRequest {
  method: string
  url: string
  headers: IncomingHttpHeaders
  body: Buffer
}

export interface Upstream {
  origin: string
  received: ReceivedRequest[]
  /** The last request the upstream saw — the assertion target for header/path tests. */
  last: () => ReceivedRequest
  respondWith: (handler: (req: IncomingMessage, res: ServerResponse) => void) => void
  close: () => Promise<void>
}

/**
 * A real HTTP server standing in for the proxied upstream.
 */
export async function startUpstream(): Promise<Upstream> {
  const received: ReceivedRequest[] = []
  let handler = (_req: IncomingMessage, res: ServerResponse): void => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end('{"ok":true}')
  }

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      received.push({
        method: req.method ?? '',
        url: req.url ?? '',
        headers: req.headers,
        body: Buffer.concat(chunks),
      })
      handler(req, res)
    })
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as AddressInfo

  return {
    origin: `http://127.0.0.1:${port}`,
    received,
    last: () => {
      const last = received.at(-1)
      if (!last) throw new Error('the upstream received no requests')
      return last
    },
    respondWith: (next) => { handler = next },
    // Idempotent: one test closes the upstream mid-case to simulate an outage,
    // and afterEach closes it again.
    close: () => new Promise<void>((resolve, reject) => {
      if (!server.listening) {
        resolve()
        return
      }
      server.close(err => err ? reject(err) : resolve())
    }),
  }
}

export interface SessionSeed {
  accessToken?: string
  tokenExpiry?: number
}

/** The @fastify/session default, and what index.ts and me.ts clear by name. */
export const SESSION_COOKIE = 'sessionId'

export async function buildAppShell(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: TRUST_PROXY })
  await app.register(fastifyCookie)
  await app.register(fastifySession, {
    secret: 'a-test-session-secret-at-least-32-characters-long',
    cookie: { secure: false, path: '/' },
    saveUninitialized: false,
    rolling: false,
  })
  await app.register(fastifyCsrf, csrfPluginOptions)
  // Mirrors index.ts's /auth/csrf-token — the only way a client gets a token,
  // and therefore the only way these tests can produce a valid one.
  app.get('/auth/csrf-token', async (_request, reply) => reply.send({ token: reply.generateCsrf() }))
  return app
}

export function seedSession(app: FastifyInstance, seed: SessionSeed): void {
  app.addHook('onRequest', async (request) => {
    Object.assign(request.session, seed)
  })
}

// Capture the request's original session ID before the proxy can destroy it.
export function trackSession(app: FastifyInstance): { stored: () => Promise<Session | null> } {
  let sid: string | undefined
  let store: FastifyRequest['sessionStore'] | undefined
  app.addHook('onRequest', async (request) => {
    sid = request.session.sessionId
    store = request.sessionStore
  })
  return {
    stored: () => new Promise((resolve, reject) => {
      if (!sid || !store) {
        reject(new Error('no request reached the session-tracking hook'))
        return
      }
      store.get(sid, (err: unknown, session?: Session | null) => {
        if (err) {
          reject(err instanceof Error ? err : new Error('session store read failed'))
          return
        }
        resolve(session ?? null)
      })
    }),
  }
}

export async function csrfCredentials(app: FastifyInstance): Promise<{ token: string, cookie: string }> {
  const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' })
  const sessionCookie = res.cookies.find(cookie => cookie.name === SESSION_COOKIE)
  if (!sessionCookie) {
    throw new Error('the CSRF token endpoint set no session cookie')
  }
  return {
    token: res.json<{ token: string }>().token,
    cookie: `${SESSION_COOKIE}=${sessionCookie.value}`,
  }
}

export async function injectWithCsrf(
  app: FastifyInstance,
  opts: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, headers?: Record<string, string>, payload?: string | Buffer },
) {
  const { token, cookie } = await csrfCredentials(app)
  return app.inject({
    method: opts.method,
    url: opts.url,
    payload: opts.payload,
    headers: { ...opts.headers, cookie, 'x-csrf-token': token },
  })
}
