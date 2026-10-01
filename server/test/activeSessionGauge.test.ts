import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  ACTIVE_SESSION_INTERVAL_MS,
  countActiveSessions,
  emitActiveSessions,
  startActiveSessionGauge,
} from '../src/session/activeSessionGauge.js'

const makePg = (rows: { idp: string | null, count: number }[]) => ({ query: vi.fn().mockResolvedValue({ rows }) })
const makeLog = () => ({ info: vi.fn(), warn: vi.fn() })

describe('countActiveSessions', () => {
  it('counts only unexpired rows that carry an access token', async () => {
    const pg = makePg([])

    await countActiveSessions(pg as never)

    const sql = pg.query.mock.calls[0][0] as string
    expect(sql).toContain('expire > NOW()')
    expect(sql).toContain('sess->>\'accessToken\' IS NOT NULL')
    expect(sql).toContain('GROUP BY')
  })

  it('returns a zero for every group that has no rows', async () => {
    const counts = await countActiveSessions(makePg([{ idp: 'google', count: 4 }]) as never)

    expect(counts).toEqual({ google: 4, microsoft: 0, unknown: 0 })
  })

  it('puts a null or unrecognised idp in the unknown group', async () => {
    const counts = await countActiveSessions(makePg([
      { idp: null, count: 2 },
      { idp: 'okta', count: 3 },
      { idp: 'microsoft', count: 1 },
    ]) as never)

    expect(counts).toEqual({ google: 0, microsoft: 1, unknown: 5 })
  })
})

describe('emitActiveSessions', () => {
  it('logs one session.active line per idp group, including zeros', async () => {
    const log = makeLog()

    await emitActiveSessions(makePg([{ idp: 'google', count: 7 }]) as never, log)

    expect(log.info.mock.calls.map(([fields]) => fields)).toEqual([
      { event: 'session.active', idp: 'google', value: 7 },
      { event: 'session.active', idp: 'microsoft', value: 0 },
      { event: 'session.active', idp: 'unknown', value: 0 },
    ])
  })

  it('logs no sample when the query fails, so the absence alert fires', async () => {
    const log = makeLog()
    const pg = { query: vi.fn().mockRejectedValue(new Error('connection refused')) }

    await expect(emitActiveSessions(pg as never, log)).resolves.toBeUndefined()

    expect(log.info).not.toHaveBeenCalled()
    expect(log.warn).toHaveBeenCalledWith(expect.objectContaining({ event: 'session.active.failed' }), 'session.active.failed')
  })
})

describe('startActiveSessionGauge', () => {
  afterEach(() => vi.useRealTimers())

  it('emits every interval and stops when the returned function is called', async () => {
    vi.useFakeTimers()
    const pg = makePg([])
    const log = makeLog()

    const stop = startActiveSessionGauge(pg as never, log, ACTIVE_SESSION_INTERVAL_MS)
    await vi.advanceTimersByTimeAsync(ACTIVE_SESSION_INTERVAL_MS * 2)
    expect(pg.query).toHaveBeenCalledTimes(2)

    stop()
    await vi.advanceTimersByTimeAsync(ACTIVE_SESSION_INTERVAL_MS * 2)
    expect(pg.query).toHaveBeenCalledTimes(2)
  })

  it('skips a tick while the previous query still runs', async () => {
    vi.useFakeTimers()
    let release: () => void = () => {}
    const pg = { query: vi.fn().mockReturnValue(new Promise((resolve) => {
      release = () => resolve({ rows: [] })
    })) }

    const stop = startActiveSessionGauge(pg as never, makeLog(), 1000)
    await vi.advanceTimersByTimeAsync(3000)
    expect(pg.query).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(1000)
    expect(pg.query).toHaveBeenCalledTimes(2)
    stop()
  })
})
