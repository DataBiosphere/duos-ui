import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLoad, sendOnce } from './driver.js'
import type { LoadOptions } from './driver.js'

const BODY = Buffer.alloc(1000, 0x41)

describe('load driver', () => {
  const paths: string[] = []
  const posted: string[] = []
  let sockets = 0
  let server: http.Server
  let origin: string

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      paths.push(req.url ?? '')
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        if (req.method === 'POST') posted.push(Buffer.concat(chunks).toString())
        if (req.url === '/hang') return
        if (req.url === '/trickle') {
          res.writeHead(200)
          const timer = setInterval(() => res.write('x'), 20)
          res.on('close', () => clearInterval(timer))
          return
        }
        res.writeHead(req.url === '/fail' ? 500 : 200, { 'content-length': String(BODY.length) })
        res.end(BODY)
      })
    })
    server.on('connection', () => {
      sockets += 1
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => new Promise<void>((resolve) => {
    server.closeAllConnections()
    server.close(() => resolve())
  }))

  const load = (overrides: Partial<LoadOptions>) => {
    paths.length = 0
    posted.length = 0
    sockets = 0
    return runLoad({
      origin, connections: 2, durationSeconds: 0.3, workers: 0, timeoutSeconds: 30,
      requests: [{ method: 'GET', path: '/a' }, { method: 'GET', path: '/b' }],
      ...overrides,
    })
  }

  it('rotates the request templates and counts header and body bytes', async () => {
    const result = await load({})

    expect(new Set(paths)).toEqual(new Set(['/a', '/b']))
    expect(result.requests.average).toBeGreaterThan(0)
    expect(result.throughput.average / result.requests.average).toBeGreaterThan(BODY.length)
    expect(result).toMatchObject({ connections: 2, non2xx: 0, errors: 0, timeouts: 0, mismatches: 0 })
  })

  it('counts non-2xx responses separately from errors', async () => {
    const result = await load({ requests: [{ method: 'GET', path: '/fail' }] })

    expect(result.non2xx).toBeGreaterThan(0)
    expect(result.errors).toBe(0)
  })

  it('counts a request with no answer as both a timeout and an error', async () => {
    const result = await load({ connections: 1, durationSeconds: 0.5, timeoutSeconds: 0.1, requests: [{ method: 'GET', path: '/hang' }] })

    expect(result.timeouts).toBeGreaterThan(0)
    expect(result.errors).toBe(result.timeouts)
  })

  it('times out a response that keeps sending bytes but never finishes', async () => {
    const result = await load({ connections: 1, durationSeconds: 0.5, timeoutSeconds: 0.1, requests: [{ method: 'GET', path: '/trickle' }] })

    expect(result.timeouts).toBeGreaterThan(0)
  })

  it('sends request bodies', async () => {
    await load({ requests: [{ method: 'POST', path: '/a', headers: { 'content-type': 'text/plain' }, body: 'hello' }] })

    expect(posted.length).toBeGreaterThan(0)
    expect(new Set(posted)).toEqual(new Set(['hello']))
  })

  it('spreads the connections over worker threads and combines their results', async () => {
    const result = await load({ connections: 3, workers: 2 })

    expect(sockets).toBe(3)
    expect(result.connections).toBe(3)
    expect(result.requests.average).toBeGreaterThan(0)
    expect(result.errors).toBe(0)
  })

  it('sends one request outside a timed run', async () => {
    const response = await sendOnce(origin, { method: 'GET', path: '/a' })

    expect(response.status).toBe(200)
    expect(response.body.equals(BODY)).toBe(true)
  })
})
