import http from 'node:http'
import https from 'node:https'
import { createHistogram } from 'node:perf_hooks'
import type { RecordableHistogram } from 'node:perf_hooks'
import type { Socket } from 'node:net'
import { Worker, workerData, parentPort } from 'node:worker_threads'

// Worker threads run this file directly, so it imports only node: built-ins
// and uses only TypeScript that Node can strip without a loader.

export interface LoadRequest {
  method: string
  path: string
  headers?: Record<string, string>
  body?: string
}

export interface LoadOptions {
  origin: string
  connections: number
  durationSeconds: number
  requests: LoadRequest[]
  timeoutSeconds: number
  workers: number
}

export interface LoadResult {
  connections: number
  requests: { average: number }
  throughput: { average: number }
  latency: { p50: number, p99: number, max: number }
  non2xx: number
  errors: number
  timeouts: number
  mismatches: number
}

interface ThreadTotals {
  responses: number
  bytes: number
  non2xx: number
  errors: number
  timeouts: number
  elapsedMs: number
  latencyUs: RecordableHistogram
}

const WORKER_MARKER = 'duosLoadDriverWorker'

// Five significant figures, as autocannon's histogram used, so flooring to whole
// milliseconds does not pick up the histogram's rounding.
const histogram = (): RecordableHistogram => createHistogram({ figures: 5 })

class RequestTimeout extends Error {}

function agentFor(origin: URL, connections: number): http.Agent {
  const options = { keepAlive: true, maxSockets: connections }
  return origin.protocol === 'https:' ? new https.Agent(options) : new http.Agent(options)
}

function requestFn(origin: URL): typeof http.request {
  return origin.protocol === 'https:' ? https.request : http.request
}

/** One request, outside the timed run: used to check a scenario's body before measuring it. */
export function sendOnce(origin: string, template: LoadRequest): Promise<{ status: number, body: Buffer }> {
  const url = new URL(template.path, origin)
  return new Promise((resolve, reject) => {
    const req = requestFn(url)(url, { method: template.method, headers: withLength(template) }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end(template.body)
  })
}

function withLength(template: LoadRequest): Record<string, string> {
  const headers = { ...template.headers }
  if (template.body !== undefined) headers['content-length'] = String(Buffer.byteLength(template.body))
  return headers
}

async function runInThread(options: LoadOptions, firstConnection: number): Promise<ThreadTotals> {
  const origin = new URL(options.origin)
  const agent = agentFor(origin, options.connections)
  const send = requestFn(origin)
  const timeoutMs = options.timeoutSeconds * 1000
  const totals: ThreadTotals = {
    responses: 0, bytes: 0, non2xx: 0, errors: 0, timeouts: 0, elapsedMs: 0, latencyUs: histogram(),
  }
  // Keep-alive sockets carry one request at a time, so bytesRead deltas are per response, headers included.
  const bytesSeen = new WeakMap<Socket, number>()
  let stopped = false

  const once = (template: LoadRequest): Promise<void> => new Promise((resolve) => {
    const started = process.hrtime.bigint()
    const url = new URL(template.path, origin)
    const req = send(url, { agent, method: template.method, headers: withLength(template) }, (res) => {
      const socket = res.socket
      res.resume()
      res.on('end', () => {
        clearTimeout(requestDeadline)
        if (!stopped) {
          totals.responses += 1
          const status = res.statusCode ?? 0
          if (status >= 200 && status < 300) {
            const read = socket.bytesRead
            totals.bytes += read - (bytesSeen.get(socket) ?? 0)
            bytesSeen.set(socket, read)
            const micros = Number(process.hrtime.bigint() - started) / 1000
            totals.latencyUs.record(Math.max(1, Math.round(micros)))
          }
          else {
            bytesSeen.set(socket, socket.bytesRead)
            totals.non2xx += 1
          }
        }
        resolve()
      })
      res.on('error', () => {
        clearTimeout(requestDeadline)
        resolve()
      })
    })
    // A deadline for the whole request, as autocannon had; req.setTimeout() only notices idle sockets.
    const requestDeadline = setTimeout(() => req.destroy(new RequestTimeout()), timeoutMs)
    req.on('error', (err) => {
      clearTimeout(requestDeadline)
      // Requests cut off when the run ends are not failures.
      if (!stopped) {
        totals.errors += 1
        if (err instanceof RequestTimeout) totals.timeouts += 1
      }
      resolve()
    })
    req.end(template.body)
  })

  const connection = async (index: number): Promise<void> => {
    for (let next = index; !stopped; next += 1) {
      await once(options.requests[next % options.requests.length])
    }
  }

  const startedAt = performance.now()
  const deadline = new Promise<void>(resolve => setTimeout(resolve, options.durationSeconds * 1000))
  const loops = Array.from({ length: options.connections }, (_, i) => connection(firstConnection + i))
  await deadline
  stopped = true
  totals.elapsedMs = performance.now() - startedAt
  agent.destroy()
  await Promise.all(loops)
  return totals
}

function runInWorker(options: LoadOptions, firstConnection: number): Promise<ThreadTotals> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { [WORKER_MARKER]: true, options, firstConnection },
    })
    worker.once('message', (totals: ThreadTotals) => resolve(totals))
    worker.once('error', reject)
    worker.once('exit', code => reject(new Error(`load driver worker exited with ${code} before reporting`)))
  })
}

/** Drive load from `options.workers` worker threads (0 runs it on this thread) and combine their results. */
export async function runLoad(options: LoadOptions): Promise<LoadResult> {
  const threads = Math.min(options.workers, options.connections)
  let parts: ThreadTotals[]
  if (threads === 0) {
    parts = [await runInThread(options, 0)]
  }
  else {
    // Spread connections evenly; the first `extra` workers take one more.
    const share = Math.floor(options.connections / threads)
    const extra = options.connections % threads
    let first = 0
    parts = await Promise.all(Array.from({ length: threads }, (_, i) => {
      const connections = share + (i < extra ? 1 : 0)
      const part = runInWorker({ ...options, connections }, first)
      first += connections
      return part
    }))
  }

  const latencyUs = histogram()
  for (const part of parts) latencyUs.add(part.latencyUs)
  const seconds = Math.max(...parts.map(part => part.elapsedMs)) / 1000
  const sum = (key: 'responses' | 'bytes' | 'non2xx' | 'errors' | 'timeouts'): number =>
    parts.reduce((total, part) => total + part[key], 0)
  // autocannon truncates latency to whole milliseconds; keep the report comparable.
  const ms = (micros: number): number => latencyUs.count === 0 ? 0 : Math.floor(micros / 1000)

  return {
    connections: options.connections,
    requests: { average: sum('responses') / seconds },
    throughput: { average: sum('bytes') / seconds },
    latency: { p50: ms(latencyUs.percentile(50)), p99: ms(latencyUs.percentile(99)), max: ms(latencyUs.max) },
    non2xx: sum('non2xx'),
    errors: sum('errors'),
    timeouts: sum('timeouts'),
    // The timed run does not compare bodies; run.ts checks one per scenario first.
    mismatches: 0,
  }
}

const data = workerData as { [WORKER_MARKER]?: boolean, options: LoadOptions, firstConnection: number } | null
if (parentPort && data?.[WORKER_MARKER]) {
  const totals = await runInThread(data.options, data.firstConnection)
  parentPort.postMessage(totals)
}
