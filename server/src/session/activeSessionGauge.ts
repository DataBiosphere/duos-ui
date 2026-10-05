import type { FastifyBaseLogger } from 'fastify'
import type { PostgresDb } from '@fastify/postgres'

/**
 * `session.active`: the authenticated-session gauge (BFF Epic 6, story 6-G).
 *
 * Cloud Logging log-based metrics are counters or distributions, never gauges,
 * so each pod runs the count on a timer and logs the value. The metric is a
 * distribution read by its mean: with three pods, every minute brings three
 * samples of the same population. Never read it as a sum or a count.
 *
 * `COUNT(*)` on the table is wrong twice. Expired rows stay until pruned, and
 * `/auth/login` writes a row before anyone has signed in. Count only rows that
 * are unexpired and carry an access token.
 */

export const ACTIVE_SESSION_INTERVAL_MS = 60_000

const IDP_GROUPS = ['google', 'microsoft', 'unknown'] as const
type IdpGroup = typeof IDP_GROUPS[number]

type GaugeLog = Pick<FastifyBaseLogger, 'info' | 'warn'>

// `user_sessions.idp` is kept in step with the session JSON by the
// `sync_session_idp` trigger, so no JSON parsing is needed to split on it.
const ACTIVE_SESSIONS_SQL = `
  SELECT COALESCE(idp, 'unknown') AS idp, COUNT(*)::int AS count
    FROM user_sessions
   WHERE expire > NOW()
     AND sess->>'accessToken' IS NOT NULL
   GROUP BY 1`

/** Counts per `idp` group. Every group is present, with 0 when it has no rows. */
export async function countActiveSessions(pg: Pick<PostgresDb, 'query'>): Promise<Record<IdpGroup, number>> {
  const { rows } = await pg.query<{ idp: string, count: number }>(ACTIVE_SESSIONS_SQL)
  const counts: Record<IdpGroup, number> = { google: 0, microsoft: 0, unknown: 0 }
  for (const row of rows) {
    // Any value other than the two known providers lands in `unknown`, so the
    // label set stays closed.
    const group: IdpGroup = row.idp === 'google' || row.idp === 'microsoft' ? row.idp : 'unknown'
    counts[group] += Number(row.count)
  }
  return counts
}

/**
 * Logs one `session.active` line per `idp` group. A group with no rows still
 * logs 0: without it the series goes silent, and "no Microsoft sessions" cannot
 * be told from "the split broke". A failed query logs no sample at all, so the
 * absence alert fires. A zero would hide an outage as an empty site.
 */
export async function emitActiveSessions(pg: Pick<PostgresDb, 'query'>, log: GaugeLog): Promise<void> {
  let counts: Record<IdpGroup, number>
  try {
    counts = await countActiveSessions(pg)
  }
  catch (err) {
    log.warn({ event: 'session.active.failed', err }, 'session.active.failed')
    return
  }
  for (const idp of IDP_GROUPS) {
    log.info({ event: 'session.active', idp, value: counts[idp] }, 'session.active')
  }
}

/**
 * Starts the per-pod timer and returns a function that stops it. The timer
 * never keeps the process alive, and a tick is skipped while the previous one
 * still runs, so a slow database cannot stack queries.
 */
export function startActiveSessionGauge(
  pg: Pick<PostgresDb, 'query'>,
  log: GaugeLog,
  intervalMs = ACTIVE_SESSION_INTERVAL_MS,
): () => void {
  let running = false
  const tick = (): void => {
    if (running) return
    running = true
    // `emitActiveSessions` handles a failed query. The only rejection left is
    // the logger itself throwing, and there is nowhere else to report that.
    emitActiveSessions(pg, log)
      .catch(() => undefined)
      .finally(() => {
        running = false
      })
  }
  const timer = setInterval(tick, intervalMs)
  timer.unref()
  return () => clearInterval(timer)
}
