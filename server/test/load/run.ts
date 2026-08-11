import { parseArgs } from 'node:util'
import autocannon from 'autocannon'
import { BLOB_PATH, blobBody, forkStubUpstream, jsonBody } from './upstream.js'
import type { ForkedUpstream } from './upstream.js'
import { startLoadTarget } from './harness.js'
import type { LoadTarget, PoolSnapshot, SeededSession } from './harness.js'
import { startDelayedRelay } from './dbLatency.js'
import type { DelayedRelay } from './dbLatency.js'
import { SCENARIOS, scenarioByName } from './scenarios.js'
import type { Scenario } from './scenarios.js'

/**
 * Load test for the BFF API proxy — epic 3, story 3-H.
 *
 *   pnpm test:load                                          # read, memory store
 *   pnpm test:load -- --scenario all --store postgres
 *   pnpm test:load -- --target https://duos.dsde-dev.broadinstitute.org \
 *       --cookie 'sessionId=…' --csrf-token '…'
 *
 * See ./README.md for what it measures, what the thresholds mean, and the
 * results that closed the story. Exits non-zero when a threshold is breached.
 */

// The pool counters are instantaneous rather than cumulative, so a coarse
// interval reads a briefly saturated pool as one that was never busy.
const POOL_SAMPLE_INTERVAL_MS = 50

interface PoolHighWater {
  maxTotal: number
  maxWaiting: number
}

interface Verdict {
  scenario: string
  result: autocannon.Result
  pool: PoolHighWater | undefined
  failures: string[]
}

const options = parseArgs({
  // pnpm forwards the `--` verbatim, and parseArgs reads everything after one
  // as positional. Dropping it makes both invocations work; there are no
  // positional arguments either way.
  args: process.argv.slice(2).filter(arg => arg !== '--'),
  options: {
    'scenario': { type: 'string', default: 'read' },
    'sessions': { type: 'string', default: '50' },
    'connections': { type: 'string' },
    'duration': { type: 'string', default: '20' },
    'warmup': { type: 'string', default: '3' },
    // Worker threads, so the driver does not compete with the server for the
    // main thread. 0 keeps everything in-process.
    'workers': { type: 'string', default: '2' },
    'store': { type: 'string', default: 'memory' },
    'pg-pool-max': { type: 'string' },
    // Overrides UPSTREAM_POOL_CONNECTIONS, whose effect is only visible when the
    // upstream is slow enough for `pool ÷ latency` to bind before the process does.
    'upstream-pool': { type: 'string' },
    // One-way — see dbLatency.ts.
    'db-latency': { type: 'string', default: '0' },
    'upstream-latency': { type: 'string', default: '20' },
    'json-bytes': { type: 'string', default: '2048' },
    'blob-bytes': { type: 'string', default: String(5 * 1024 * 1024) },
    // Remote mode: drive an already-deployed BFF instead of a local target.
    'target': { type: 'string' },
    'cookie': { type: 'string' },
    'csrf-token': { type: 'string' },
  },
}).values

/**
 * Bounds are checked here rather than where the values are used: a count of zero
 * reaches `sessions[0]` or autocannon's own validator instead, several seconds
 * and one forked stub later.
 */
interface Bounds {
  min: number
  /** Counts are whole; latencies and durations need not be. */
  whole?: boolean
}

const number = (value: string | undefined, name: string, bounds: Bounds): number | undefined => {
  if (value === undefined) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`--${name} is '${value}', which is not a number`)
  if (bounds.whole && !Number.isInteger(parsed)) throw new Error(`--${name} is '${value}', which is not a whole number`)
  if (parsed < bounds.min) throw new Error(`--${name} is ${parsed}, below the minimum of ${bounds.min}`)
  return parsed
}

const required = (value: string | undefined, name: string, bounds: Bounds): number => {
  const parsed = number(value, name, bounds)
  if (parsed === undefined) throw new Error(`--${name} is required`)
  return parsed
}

function parseStore(value: string | undefined): 'memory' | 'postgres' {
  if (value !== 'memory' && value !== 'postgres') {
    throw new Error(`--store is '${value}' — expected 'memory' or 'postgres'`)
  }
  return value
}

const storeOption = parseStore(options.store)

const upstreamLatencyMs = required(options['upstream-latency'], 'upstream-latency', { min: 0 })
// At least one: every session-bearing scenario needs a cookie to send.
const sessionCount = required(options.sessions, 'sessions', { min: 1, whole: true })
const durationSeconds = required(options.duration, 'duration', { min: 1 })
const warmupSeconds = required(options.warmup, 'warmup', { min: 0 })
const workers = required(options.workers, 'workers', { min: 0, whole: true })
const dbLatencyMs = required(options['db-latency'], 'db-latency', { min: 0 })
const jsonBytes = required(options['json-bytes'], 'json-bytes', { min: 1, whole: true })
const blobBytes = required(options['blob-bytes'], 'blob-bytes', { min: 0, whole: true })
const connectionsOverride = number(options.connections, 'connections', { min: 1, whole: true })
const pgPoolMax = number(options['pg-pool-max'], 'pg-pool-max', { min: 1, whole: true })
const undiciConnections = number(options['upstream-pool'], 'upstream-pool', { min: 1, whole: true })
const scenarios = options.scenario === 'all' ? SCENARIOS : [scenarioByName(options.scenario ?? 'read')]

/**
 * A run with a fine p99 and `maxWaiting` at zero has not proven the pool is big
 * enough — only that this load did not need more than it had.
 */
function samplePool(target: LoadTarget | undefined): () => PoolHighWater | undefined {
  const initial = target?.poolSnapshot()
  if (!target || !initial) return () => undefined

  const high: PoolHighWater = { maxTotal: 0, maxWaiting: 0 }
  const observe = (snapshot: PoolSnapshot): void => {
    high.maxTotal = Math.max(high.maxTotal, snapshot.total)
    high.maxWaiting = Math.max(high.maxWaiting, snapshot.waiting)
  }
  observe(initial)

  const timer = setInterval(() => {
    const snapshot = target.poolSnapshot()
    if (snapshot) observe(snapshot)
  }, POOL_SAMPLE_INTERVAL_MS)

  return () => {
    clearInterval(timer)
    return high
  }
}

/**
 * One request through the proxy, asserted byte-for-byte against what the stub
 * serves, before the scenario is measured. Throughput numbers say nothing about
 * whether the bytes were right, and autocannon cannot check a body while it is
 * cycling per-session request templates (`expectBody` and `requests` are
 * mutually exclusive), so the check happens once, here.
 */
async function verifyScenarioBody(scenario: Scenario, origin: string, session: SeededSession): Promise<void> {
  const template = scenario.request(session)
  const response = await fetch(`${origin}${template.path}`, {
    method: template.method,
    headers: template.headers as Record<string, string>,
    body: template.body as string | undefined,
  })
  const expected = template.path?.includes(BLOB_PATH) ? blobBody(blobBytes) : jsonBody(jsonBytes)
  const received = Buffer.from(await response.arrayBuffer())
  if (response.status !== 200) {
    throw new Error(`${scenario.name}: proxy answered ${response.status}, so the run would have measured an error path`)
  }
  if (!received.equals(expected)) {
    throw new Error(`${scenario.name}: proxied body was ${received.length} bytes, expected ${expected.length} from the upstream`)
  }
}

async function runScenario(
  scenario: Scenario,
  origin: string,
  sessions: SeededSession[],
  target: LoadTarget | undefined,
  /**
   * Undefined against a deployed BFF, where the numbers are end-to-end: the
   * budgets are proxy overhead above the upstream's own latency, and a remote
   * run cannot measure that latency independently while it loads the proxy.
   * Only the correctness checks below survive there.
   */
  latencyBudgetMs: number | undefined,
): Promise<Verdict> {
  const connections = connectionsOverride ?? scenario.defaultConnections
  // One template per session, cycled by each connection, so N sessions are in
  // flight at once. An anonymous scenario ignores the session it is handed.
  const requests = (scenario.needsSession ? sessions : [{ cookie: '', csrfToken: '' }])
    .map(session => scenario.request(session))

  const run = (duration: number): Promise<autocannon.Result> => autocannon({
    url: origin,
    connections,
    duration,
    workers: workers > 0 ? workers : undefined,
    requests,
    title: scenario.name,
    // A timeout should mean the BFF stopped answering, not that it was slow.
    timeout: 30,
  })

  // Discarded: the first seconds measure the JIT and the undici pool opening
  // its sockets, neither of which a steady-state service pays for.
  if (warmupSeconds > 0) await run(warmupSeconds)

  const stopSampling = samplePool(target)
  const result = await run(durationSeconds)
  const pool = stopSampling()

  const failures: string[] = []
  if (result.non2xx > 0) failures.push(`${result.non2xx} non-2xx responses`)
  if (result.errors > 0) failures.push(`${result.errors} connection errors`)
  if (result.timeouts > 0) failures.push(`${result.timeouts} timeouts`)
  if (result.mismatches > 0) failures.push(`${result.mismatches} responses whose body was not the upstream's`)
  if (latencyBudgetMs !== undefined && result.latency.p99 > latencyBudgetMs) {
    failures.push(`p99 ${result.latency.p99}ms over the ${latencyBudgetMs}ms budget (${upstreamLatencyMs}ms upstream + ${scenario.p99BudgetMs}ms proxy)`)
  }

  return { scenario: scenario.name, result, pool, failures }
}

function report(verdicts: Verdict[]): void {
  const rows = verdicts.map(({ scenario, result, pool }) => ({
    'scenario': scenario,
    'conns': String(result.connections),
    'req/s': result.requests.average.toFixed(0),
    'MB/s': (result.throughput.average / 1024 / 1024).toFixed(1),
    'p50': `${result.latency.p50}ms`,
    'p99': `${result.latency.p99}ms`,
    'max': `${result.latency.max}ms`,
    'non2xx': String(result.non2xx),
    'err': String(result.errors),
    'bad body': String(result.mismatches),
    'pool max/waiting': pool ? `${pool.maxTotal}/${pool.maxWaiting}` : '—',
  }))

  const columns = Object.keys(rows[0] ?? {}) as (keyof (typeof rows)[number])[]
  const width = (column: keyof (typeof rows)[number]): number =>
    Math.max(column.length, ...rows.map(row => row[column].length))
  const line = (cells: string[]): string => cells.map((cell, i) => cell.padEnd(width(columns[i]))).join('  ')

  console.log()
  console.log(line(columns as string[]))
  console.log(line(columns.map(column => '-'.repeat(width(column)))))
  for (const row of rows) console.log(line(columns.map(column => row[column])))
  console.log()

  for (const { scenario, failures } of verdicts) {
    if (failures.length === 0) console.log(`PASS  ${scenario}`)
    else console.log(`FAIL  ${scenario} — ${failures.join('; ')}`)
  }
}

async function main(): Promise<number> {
  const remote = options.target
  let upstream: ForkedUpstream | undefined
  let relay: DelayedRelay | undefined
  let target: LoadTarget | undefined
  const verdicts: Verdict[] = []

  // Setup is inside the try, not before it: a stub is forked first, so anything
  // that throws after that — an unreachable database, a bad flag — would
  // otherwise leave the child running and the runner waiting on it forever.
  try {
    let origin: string
    let sessions: SeededSession[]

    if (remote) {
      // No seeding route on a deployed BFF, so the one session comes from a real
      // browser sign-in — which measures the proxy, not session-store concurrency.
      if (!options.cookie) throw new Error('--target requires --cookie (a real signed-in sessionId cookie)')
      origin = remote
      sessions = [{ cookie: options.cookie, csrfToken: options['csrf-token'] ?? '' }]
      console.log(`target: ${origin} (remote — no stub upstream, no pool sampling)`)
      console.log('latency below is end-to-end for this environment, not proxy overhead; only errors and non-2xx can fail the run')
    }
    else {
      if (dbLatencyMs > 0 && storeOption !== 'postgres') {
        throw new Error('--db-latency only applies to --store postgres')
      }
      upstream = await forkStubUpstream({
        latencyMs: upstreamLatencyMs,
        jsonBytes,
        blobBytes,
      })
      if (dbLatencyMs > 0) {
        relay = await startDelayedRelay({
          host: process.env.DUOS_DB_HOST ?? '127.0.0.1',
          port: Number.parseInt(process.env.DUOS_DB_PORT?.trim() || '5432', 10),
        }, dbLatencyMs)
      }
      target = await startLoadTarget({
        upstreamOrigin: upstream.origin,
        store: storeOption,
        pgPoolMax,
        undiciConnections,
        dbAddress: relay ? { host: '127.0.0.1', port: relay.port } : undefined,
      })
      origin = target.origin
      sessions = await target.seedSessions(sessionCount)
      const db = relay ? `  db: +${dbLatencyMs}ms each way` : ''
      const pool = options['upstream-pool'] ? `  upstream pool: ${options['upstream-pool']}` : ''
      console.log(`target: ${origin}  upstream: ${upstream.origin} (+${upstreamLatencyMs}ms, own process)  store: ${storeOption}${db}${pool}  sessions: ${sessions.length}`)
    }

    for (const scenario of scenarios) {
      console.log(`\n▸ ${scenario.name}: ${scenario.description}`)
      // Only against the stub: a real upstream's body is not known here.
      if (!remote) await verifyScenarioBody(scenario, origin, sessions[0])
      const budget = remote ? undefined : upstreamLatencyMs + scenario.p99BudgetMs
      verdicts.push(await runScenario(scenario, origin, sessions, target, budget))
    }
  }
  finally {
    await target?.close()
    await relay?.close()
    await upstream?.close()
  }

  report(verdicts)
  return verdicts.some(verdict => verdict.failures.length > 0) ? 1 : 0
}

// No process.exit(): it can truncate a redirected report mid-write, and with
// every server closed above there is nothing left holding the loop open.
process.exitCode = await main()
