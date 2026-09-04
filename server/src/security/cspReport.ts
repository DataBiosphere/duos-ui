import type { FastifyBaseLogger, FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { RateLimitOptions } from '@fastify/rate-limit'

/**
 * The CSP violation report sink.
 *
 * This is an unauthenticated POST that any browser on the internet can be made
 * to hit, and everything it accepts ends up in the pod's logs — a
 * log-amplification target. Six controls bound that:
 *
 *  1. A small body limit (8 KB), enforced by Fastify before the parser runs.
 *  2. Exactly two accepted media types; everything else gets 415 without
 *     reaching a handler.
 *  3. A cap on how many reports one request may contribute. Neither parser
 *     checks the body's shape, so an 8 KB array of minimal entries — around
 *     170 of them fit — is one request that would otherwise write 170 lines.
 *  4. A field allowlist — only the report fields the spec defines survive,
 *     each truncated. Unknown keys never reach the log.
 *  5. A fixed-window budget charged once per *request*, not once per report,
 *     so no single request can spend more than one unit of it. Requests over
 *     the budget still answer 204; they are simply not written.
 *  6. A per-client rate limit, so requests over it are refused with 429 rather
 *     than accepted and parsed. The budget above bounds what is *written*; on
 *     its own it leaves the endpoint reading every request it is sent.
 *
 * Fastify's own per-request logging is switched off for this route
 * (`logLevel: 'silent'`). Without that, every POST — including the ones
 * rejected with 415 or 413 before any handler runs — would still emit an
 * `incoming request` / `request completed` pair that none of the controls
 * above bounds, and log volume would track request rate directly. The report
 * lines go through `app.log` rather than `request.log` for the same reason;
 * see the note at the route.
 *
 * The budget is per process, and so per pod. An operator sizing log ingest from
 * MAX_LOGGED_PER_WINDOW × MAX_REPORTS_PER_REQUEST must multiply by the replica
 * count; the constants below are one pod's ceiling, not the deployment's.
 *
 * Story 5-G adds real per-route rate limiting at the edge and through
 * `@fastify/rate-limit`; the counter here is the log-volume floor beneath it.
 */

/** Where the browser posts violation reports. Story 5-F3's policy points here. */
export const CSP_REPORT_PATH = '/csp-report'

/** The `report-to` group name, paired with the `Reporting-Endpoints` header. */
export const CSP_REPORT_GROUP = 'csp-endpoint'

/** Browsers post reports under exactly these two media types. */
const REPORT_CONTENT_TYPES = ['application/csp-report', 'application/reports+json'] as const

/** A violation report is a handful of short fields — 8 KB is already generous. */
export const REPORT_BODY_LIMIT = 8 * 1024

/** Longest string value written to the log, per field. */
const MAX_FIELD_LENGTH = 512

/**
 * Reports one request may contribute to the log. `report-uri` posts exactly
 * one; `report-to` posts whatever the browser has queued for the endpoint,
 * which for a single page load is a handful. Eight leaves a genuine batch
 * intact while keeping a hand-built array from writing more than eight lines.
 */
export const MAX_REPORTS_PER_REQUEST = 8

/** Requests allowed to log per window before the rest are counted and dropped. */
const MAX_LOGGED_PER_WINDOW = 60
const LOG_WINDOW_MS = 60_000

/**
 * Requests one client may make per window before the endpoint refuses them
 * with 429, independently of what gets logged.
 *
 * Deliberately below MAX_LOGGED_PER_WINDOW: the log budget is global to the
 * pod, so a per-client limit above it would let one caller spend the whole
 * thing. Thirty a minute still lets a genuinely broken page report freely —
 * a violation that repeats past that adds nothing the first thirty did not
 * already say.
 *
 * `request.ip` reads X-Forwarded-For because the app sets `trustProxy`, so
 * this counts real clients rather than the sidecar. The store is per process:
 * see the note in index.ts on why the edge is where flood protection belongs.
 */
export const MAX_REQUESTS_PER_WINDOW = 30

/**
 * Report fields worth logging, in both spellings browsers use: the hyphenated
 * `application/csp-report` body and the camelCase `application/reports+json`
 * body. Anything outside this set is dropped rather than logged.
 */
const ALLOWED_REPORT_FIELDS: ReadonlySet<string> = new Set([
  'blocked-uri', 'blockedURL',
  'column-number', 'columnNumber',
  'disposition',
  'document-uri', 'documentURL',
  'effective-directive', 'effectiveDirective',
  'line-number', 'lineNumber',
  'original-policy', 'originalPolicy',
  'referrer',
  'sample', 'script-sample',
  'source-file', 'sourceFile',
  'status-code', 'statusCode',
  'violated-directive', 'violatedDirective',
])

/** Truncated, and stripped of control characters so one report stays one log line. */
function sanitizeValue(value: string): string {
  // oxlint-disable-next-line no-control-regex
  const flattened = value.replace(/[\u0000-\u001F\u007F]/g, ' ')
  return flattened.length > MAX_FIELD_LENGTH ? `${flattened.slice(0, MAX_FIELD_LENGTH)}…` : flattened
}

/** Keeps only allowlisted fields with primitive values. Undefined when nothing survives. */
export function sanitizeReport(raw: unknown): Record<string, string | number> | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const report: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED_REPORT_FIELDS.has(key)) continue
    if (typeof value === 'string') report[key] = sanitizeValue(value)
    else if (typeof value === 'number' && Number.isFinite(value)) report[key] = value
  }
  return Object.keys(report).length > 0 ? report : undefined
}

/**
 * Pulls the violation objects out of either body shape.
 *
 * `report-uri` sends one report as `{ "csp-report": { … } }`.
 * `report-to` sends a batch as `[{ type, url, body: { … } }, …]`, which can
 * carry other report types (deprecation, intervention) alongside CSP ones.
 */
export function extractReports(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body
      .filter((entry): entry is { type: string, body: unknown } =>
        typeof entry === 'object' && entry !== null && (entry as { type?: unknown }).type === 'csp-violation')
      .map(entry => entry.body)
  }
  if (typeof body === 'object' && body !== null && 'csp-report' in body) {
    return [(body as Record<string, unknown>)['csp-report']]
  }
  return []
}

interface LogBudget {
  /**
   * Reserves this request's single unit of budget. `reportCount` is only used
   * to size the dropped tally when the answer is no.
   */
  admit: (reportCount: number) => boolean
  /** Stops the heartbeat and writes any count still pending. */
  close: () => void
}

/**
 * Fixed-window log budget. Closed over per registration rather than held at
 * module scope so each built app — and so each test — starts fresh.
 *
 * The dropped tally is written through the app's logger, not a request's. It
 * describes traffic the caller of the moment had nothing to do with, and
 * borrowing `request.log` would stamp it with an unrelated `reqId`.
 */
function createLogBudget(log: FastifyBaseLogger): LogBudget {
  let windowStart = 0
  let logged = 0
  let dropped = 0

  function flush(): void {
    if (dropped === 0) return
    log.warn({ dropped }, '[csp] violation reports dropped without logging — over the per-minute budget')
    dropped = 0
  }

  // The window only rolls over when a later request arrives, so a flood
  // followed by silence — a quiet environment, or overnight — would leave the
  // count unwritten indefinitely. This bounds that wait to one window.
  // unref()'d so it never by itself holds the process, or a test run, open.
  const heartbeat = setInterval(flush, LOG_WINDOW_MS)
  heartbeat.unref()

  return {
    admit(reportCount: number): boolean {
      const now = Date.now()
      if (now - windowStart >= LOG_WINDOW_MS) {
        flush()
        windowStart = now
        logged = 0
      }
      if (logged >= MAX_LOGGED_PER_WINDOW) {
        dropped += reportCount
        return false
      }
      logged += 1
      return true
    },
    close(): void {
      clearInterval(heartbeat)
      // A pod rolled by a deploy is the other way the count gets lost; this is
      // the last chance to write it.
      flush()
    },
  }
}

/**
 * The `Reporting-Endpoints` header that gives the policy's `report-to` group an
 * address. Without it `report-to` names a group the browser cannot resolve and
 * only the `report-uri` fallback works.
 */
export const REPORTING_ENDPOINTS_HEADER = `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`

/**
 * Registered as a plain (non-`fastify-plugin`) function so Fastify gives it its
 * own encapsulation context: `removeAllContentTypeParsers()` below then applies
 * to this scope alone and leaves the rest of the app's parsers untouched.
 */
export async function cspReportRoute(app: FastifyInstance): Promise<void> {
  const budget = createLogBudget(app.log)
  app.addHook('onClose', async () => budget.close())

  // The app-level error handler is installed in index.ts *after* this plugin is
  // registered, so Fastify never resolves it for this route. Without one here,
  // the default serialiser answers 415 with FST_ERR_CTP_INVALID_MEDIA_TYPE and
  // 413 with FST_ERR_CTP_BODY_TOO_LARGE — naming the framework to an
  // unauthenticated caller, where every other route generalises. The status is
  // the whole useful response here, as it is for the handler's own 204: the
  // browser discards a report POST's body either way. Deliberately not logged —
  // writing a line per rejected request is the amplification this file exists
  // to prevent.
  app.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) =>
    reply.status(error.statusCode ?? 500).send())

  // Cleared, then exactly the two report media types re-added. Anything else —
  // including the JSON and text parsers inherited from the parent scope — now
  // has no parser here, so Fastify answers 415 before a handler runs.
  app.removeAllContentTypeParsers()
  for (const contentType of REPORT_CONTENT_TYPES) {
    app.addContentTypeParser(contentType, { parseAs: 'string', bodyLimit: REPORT_BODY_LIMIT }, (_request, body, done) => {
      try {
        done(null, JSON.parse(body as string))
      }
      catch {
        // A malformed body is indistinguishable from noise and is not worth a
        // 400 or a log line: hand the handler an empty object and answer 204.
        done(null, {})
      }
    })
  }

  // `logLevel: 'silent'` turns off Fastify's own `incoming request` /
  // `request completed` pair for this route — emitted even for the 415s and
  // 413s that never reach the handler, and so the one source of log volume
  // none of the controls above bounds.
  //
  // It silences `request.log` with it, which is why the report lines below go
  // through `app.log` instead. A route level *pins* rather than raises: had
  // this been `'warn'` to keep `request.log`, the route would have overridden
  // a deployment that deliberately set FASTIFY_LOG_LEVEL lower. `app.log`
  // honours that setting, and carrying `reqId` explicitly keeps the one thing
  // request.log was worth here — telling which lines arrived together.
  // Read by @fastify/rate-limit, which index.ts registers with `global: false`.
  // Ignored when the plugin is absent, which is what lets the unit tests
  // exercise this route on a bare instance. The story asks for a real rate
  // limit here, not only a log budget: without one the endpoint still accepts
  // and parses every request it is sent.
  const rateLimit: RateLimitOptions = {
    max: MAX_REQUESTS_PER_WINDOW,
    timeWindow: LOG_WINDOW_MS,
    // The plugin *throws* whatever this returns, so it has to carry the
    // status; the route's own error handler above then answers with that and
    // no body. Same reason as the bare 415: the browser discards this
    // response, and the default builder's body would echo the retry window
    // back to whoever is probing for it.
    errorResponseBuilder: (_request, context) => ({ statusCode: context.statusCode }),
  }

  const routeOptions = {
    bodyLimit: REPORT_BODY_LIMIT,
    logLevel: 'silent' as const,
    config: { rateLimit },
  }

  app.post(CSP_REPORT_PATH, routeOptions, async (request: FastifyRequest, reply: FastifyReply) => {
    // Capped before sanitising, so the work a request can provoke is bounded
    // too, and charged as one unit however many survive: 174 entries fit in an
    // 8 KB body, and charging per report would let one POST spend the whole
    // window and silence every genuine report until it rolled over.
    const reports = extractReports(request.body)
      .slice(0, MAX_REPORTS_PER_REQUEST)
      .map(sanitizeReport)
      .filter((report): report is Record<string, string | number> => report !== undefined)

    if (reports.length > 0 && budget.admit(reports.length)) {
      for (const report of reports) app.log.warn({ reqId: request.id, report }, '[csp] violation report')
    }

    // Always 204, and never a body: the browser ignores the response, and a
    // status that varied with the content would turn this into an oracle.
    return reply.status(204).send()
  })
}
