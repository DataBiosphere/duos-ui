import http from 'node:http'
import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface StubUpstreamOptions {
  latencyMs: number
  jsonBytes: number
  blobBytes: number
}

export interface StubUpstream {
  origin: string
  received: () => number
  close: () => Promise<void>
}

export const BLOB_PATH = '/api/daa/1/file'

export function jsonBody(bytes: number): Buffer {
  const envelope = { datasetId: 1, name: 'load', padding: '' }
  const overhead = JSON.stringify(envelope).length
  envelope.padding = 'x'.repeat(Math.max(0, bytes - overhead))
  return Buffer.from(JSON.stringify(envelope))
}

export function blobBody(bytes: number): Buffer {
  return Buffer.alloc(bytes, 0x41)
}

export async function startStubUpstream(options: StubUpstreamOptions): Promise<StubUpstream> {
  const json = jsonBody(options.jsonBytes)
  const blob = blobBody(options.blobBytes)
  let received = 0

  const respond = (req: IncomingMessage, res: ServerResponse): void => {
    received += 1
    const [body, contentType] = req.url?.startsWith(BLOB_PATH)
      ? [blob, 'application/octet-stream']
      : [json, 'application/json']
    const write = (): void => {
      res.writeHead(200, { 'content-type': contentType, 'content-length': String(body.length) })
      res.end(body)
    }
    if (options.latencyMs > 0) setTimeout(write, options.latencyMs)
    else write()
  }

  const server = http.createServer((req, res) => {
    // Drain first, or the write scenario measures a stalled socket.
    req.resume()
    req.on('end', () => respond(req, res))
  })
  // Avoid mistaking idle stub sockets for BFF connection errors.
  server.keepAliveTimeout = 120_000

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as AddressInfo

  return {
    origin: `http://127.0.0.1:${port}`,
    received: () => received,
    close: () => new Promise<void>((resolve, reject) => {
      server.closeAllConnections()
      server.close(err => err ? reject(err) : resolve())
    }),
  }
}

export interface ForkedUpstream {
  origin: string
  close: () => Promise<number>
}

export async function forkStubUpstream(options: StubUpstreamOptions): Promise<ForkedUpstream> {
  // Inherited execArgv carries tsx's TypeScript loader into the child.
  const child = fork(fileURLToPath(import.meta.url), [JSON.stringify(options)])

  const origin = await new Promise<string>((resolve, reject) => {
    child.once('message', (message: { origin?: string }) => {
      if (message.origin) resolve(message.origin)
      else reject(new Error(`stub upstream sent ${JSON.stringify(message)} instead of its origin`))
    })
    child.once('error', reject)
    child.once('exit', code => reject(new Error(`stub upstream exited with ${code} before reporting its origin`)))
  })
  child.removeAllListeners('exit')

  return {
    origin,
    close: () => new Promise<number>((resolve) => {
      child.once('message', (message: { received?: number }) => resolve(message.received ?? 0))
      child.once('exit', () => resolve(0))
      child.send({ close: true })
    }),
  }
}

if (process.send && process.argv[2]) {
  const stub = await startStubUpstream(JSON.parse(process.argv[2]) as StubUpstreamOptions)
  // Ensure an interrupted parent cannot orphan the stub.
  process.on('disconnect', () => process.exit(0))
  process.on('message', (message: { close?: boolean }) => {
    if (!message.close) return
    process.send?.({ received: stub.received() })
    void stub.close().then(() => process.exit(0))
  })
  process.send({ origin: stub.origin })
}
