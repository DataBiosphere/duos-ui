import { parseArgs } from 'node:util'
import autocannon from 'autocannon'
import { BLOB_PATH, blobBody, forkStubUpstream, jsonBody } from './upstream.js'
import { startLoadTarget } from './harness.js'
import type { LoadTarget, PoolSnapshot, SeededSession } from './harness.js'
import { startDelayedRelay } from './dbLatency.js'
import type { DelayedRelay } from './dbLatency.js'
import { SCENARIOS, scenarioByName } from './scenarios.js'
import type { Scenario } from './scenarios.js'

// Pool counters are instantaneous, so sample frequently enough to catch bursts.
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
  // pnpm may forward `--`, which parseArgs would treat as the end of options.
  args: process.argv.slice(2).filter(arg => arg !== '--'),
  options: {
    'scenario': { type: 'string', default: 'read' },
    'sessions': { type: 'string', default: '50' },
    'connections': { type: 'string' },
    'duration': { type: 'string', default: '20' },
    'warmup': { type: 'string', default: '3' },
    'workers': { type: 'string', default: '2' },
    'store': { type: 'string', default: 'memory' },
    'pg-pool-max': { type: 'string' },
    'upstream-pool': { type: 'string' },
    'db-latency': { type: 'string', default: '0' },
    'upstream-latency': { type: 'string', default: '20' },
    'json-bytes': { type: 'string', default: '2048' },
    'blob-bytes': { type: 'string', default: String(5 * 1024 * 1024) },
    'target': { type: 'string' },
    'cookie': { type: 'string' },
    'csrf-token': { type: 'string' },
  },
}).values

interface Bounds {
  min: number
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

// autocannon cannot combine expectBody with per-session request templates.
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

async function runScenario(scenario: Scenario, loadRun: LoadRun): Promise<Verdict> {
  const latencyBudgetMs = loadRun.latencyBudgetFor(scenario)
  const connections = connectionsOverride ?? scenario.defaultConnections
  const requests = (scenario.needsSession ? loadRun.sessions : [{ cookie: '', csrfToken: '' }])
    .map(session => scenario.request(session))

  const run = (duration: number): Promise<autocannon.Result> => autocannon({
    url: loadRun.origin,
    connections,
    duration,
    workers: workers > 0 ? workers : undefined,
    requests,
    title: scenario.name,
    timeout: 30,
  })

  // Exclude JIT and connection-pool startup from steady-state measurements.
  if (warmupSeconds > 0) await run(warmupSeconds)

  const stopSampling = samplePool(loadRun.target)
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

interface LoadRun {
  origin: string
  sessions: SeededSession[]
  target: LoadTarget | undefined
  latencyBudgetFor: (scenario: Scenario) => number | undefined
  verifyBody: (scenario: Scenario) => Promise<void>
  close: () => Promise<void>
}

function startRemoteRun(origin: string): LoadRun {
  if (!options.cookie) throw new Error('--target requires --cookie (a real signed-in sessionId cookie)')
  console.log(`target: ${origin} (remote — no stub upstream, no pool sampling)`)
  console.log('latency below is end-to-end for this environment, not proxy overhead; only errors and non-2xx can fail the run')

  return {
    origin,
    sessions: [{ cookie: options.cookie, csrfToken: options['csrf-token'] ?? '' }],
    target: undefined,
    latencyBudgetFor: () => undefined,
    verifyBody: () => Promise.resolve(),
    close: () => Promise.resolve(),
  }
}

async function startLocalRun(): Promise<LoadRun> {
  if (dbLatencyMs > 0 && storeOption !== 'postgres') {
    throw new Error('--db-latency only applies to --store postgres')
  }

  const upstream = await forkStubUpstream({ latencyMs: upstreamLatencyMs, jsonBytes, blobBytes })
  let relay: DelayedRelay | undefined
  let target: LoadTarget | undefined
  const close = async (): Promise<void> => {
    await target?.close()
    await relay?.close()
    await upstream.close()
  }

  // Setup failures must not leave the already-forked stub running.
  try {
    if (dbLatencyMs > 0) {
      relay = await startDelayedRelay({
        host: process.env.DUOS_DB_HOST ?? '127.0.0.1',
        port: Number.parseInt(process.env.DUOS_DB_PORT?.trim() || '5432', 10),
      }, dbLatencyMs)
    }
    const started = await startLoadTarget({
      upstreamOrigin: upstream.origin,
      store: storeOption,
      pgPoolMax,
      undiciConnections,
      dbAddress: relay ? { host: '127.0.0.1', port: relay.port } : undefined,
    })
    target = started
    const sessions = await started.seedSessions(sessionCount)

    const db = relay ? `  db: +${dbLatencyMs}ms each way` : ''
    const pool = undiciConnections ? `  upstream pool: ${undiciConnections}` : ''
    console.log(`target: ${started.origin}  upstream: ${upstream.origin} (+${upstreamLatencyMs}ms, own process)  store: ${storeOption}${db}${pool}  sessions: ${sessions.length}`)

    return {
      origin: started.origin,
      sessions,
      target: started,
      latencyBudgetFor: scenario => upstreamLatencyMs + scenario.p99BudgetMs,
      verifyBody: scenario => verifyScenarioBody(scenario, started.origin, sessions[0]),
      close,
    }
  }
  catch (err: unknown) {
    await close()
    throw err
  }
}

async function main(): Promise<number> {
  const loadRun = options.target ? startRemoteRun(options.target) : await startLocalRun()
  const verdicts: Verdict[] = []

  try {
    for (const scenario of scenarios) {
      console.log(`\n▸ ${scenario.name}: ${scenario.description}`)
      await loadRun.verifyBody(scenario)
      verdicts.push(await runScenario(scenario, loadRun))
    }
  }
  finally {
    await loadRun.close()
  }

  report(verdicts)
  return verdicts.some(verdict => verdict.failures.length > 0) ? 1 : 0
}

// process.exit() can truncate redirected output.
process.exitCode = await main()
