import http from 'node:http'
import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * A stub DUOS API for the load harness (story 3-H).
 *
 * Bodies are allocated once at startup, but parsing requests and writing
 * responses is still real work on a real event loop — which is why `run.ts`
 * forks this file as its own process rather than calling `startStubUpstream`
 * in-process. Sharing the BFF's event loop would make the stub's service time
 * indistinguishable from the proxy's.
 *
 * `latencyMs` is what makes requests queue on a finite set of upstream sockets;
 * a zero-latency upstream cannot produce that.
 */

export interface StubUpstreamOptions {
  latencyMs: number
  jsonBytes: number
  blobBytes: number
}

export interface StubUpstream {
  origin: string
  /** Cross-checks the driver's own count. */
  received: () => number
  close: () => Promise<void>
}

/** The one path answered with a large binary body; everything else gets JSON. */
export const BLOB_PATH = '/api/daa/1/file'

/**
 * Exported so the driver can assert a proxied body arrived byte-for-byte, and
 * not merely that the status was 200.
 */
export function jsonBody(bytes: number): Buffer {
  // Padded to roughly `bytes` — nothing in the proxy path parses it.
  const envelope = { datasetId: 1, name: 'load', padding: '' }
  const overhead = JSON.stringify(envelope).length
  envelope.padding = 'x'.repeat(Math.max(0, bytes - overhead))
  return Buffer.from(JSON.stringify(envelope))
}

/** Exported alongside `jsonBody`, and for the same reason. */
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
  // The 5s default closes sockets mid-run at low request rates, which reads as
  // connection errors belonging to the BFF.
  server.keepAliveTimeout = 120_000

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as AddressInfo

  return {
    origin: `http://127.0.0.1:${port}`,
    received: () => received,
    close: () => new Promise<void>((resolve, reject) => {
      // Keep-alive sockets would otherwise hold the process open past the run.
      server.closeAllConnections()
      server.close(err => err ? reject(err) : resolve())
    }),
  }
}

export interface ForkedUpstream {
  origin: string
  /** Resolves with the number of requests the stub answered. */
  close: () => Promise<number>
}

/** Starts the stub in its own process, off the BFF's event loop. */
export async function forkStubUpstream(options: StubUpstreamOptions): Promise<ForkedUpstream> {
  // execArgv is inherited, which is what carries tsx's TypeScript loader into
  // the child.
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
      // Whatever happens, don't leave a child behind: an unanswered shutdown
      // resolves when the process goes away.
      child.once('exit', () => resolve(0))
      child.send({ close: true })
    }),
  }
}

/**
 * Child-process entry, forked above. Options arrive as the first argv entry and
 * the origin goes back over the IPC channel, so neither side has to agree on a
 * port in advance.
 */
if (process.send && process.argv[2]) {
  const stub = await startStubUpstream(JSON.parse(process.argv[2]) as StubUpstreamOptions)
  // A stub that outlives the run holds its port and never gets noticed. The
  // channel closes whether the runner exits cleanly, throws, or is killed.
  process.on('disconnect', () => process.exit(0))
  process.on('message', (message: { close?: boolean }) => {
    if (!message.close) return
    process.send?.({ received: stub.received() })
    void stub.close().then(() => process.exit(0))
  })
  process.send({ origin: stub.origin })
}
