import type { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CSP_REPORT_GROUP, CSP_REPORT_PATH } from './csp.js'

/**
 * The CSP violation report sink.
 *
 * This is an unauthenticated POST that any browser on the internet can be made
 * to hit, and everything it accepts ends up in the pod's logs — a
 * log-amplification target. Four controls bound that:
 *
 *  1. A small body limit (8 KB), enforced by Fastify before the parser runs.
 *  2. Exactly two accepted media types; everything else gets 415 without
 *     reaching a handler.
 *  3. A field allowlist — only the report fields the spec defines survive,
 *     each truncated. Unknown keys never reach the log.
 *  4. A fixed-window cap on how many reports are logged per minute. Requests
 *     over the cap still answer 204; they are simply not written.
 *
 * Story 5-G adds real per-route rate limiting at the edge and through
 * `@fastify/rate-limit`; the counter here is the log-volume floor beneath it.
 */

/** Browsers post reports under exactly these two media types. */
const REPORT_CONTENT_TYPES = ['application/csp-report', 'application/reports+json'] as const

/** A violation report is a handful of short fields — 8 KB is already generous. */
export const REPORT_BODY_LIMIT = 8 * 1024

/** Longest string value written to the log, per field. */
const MAX_FIELD_LENGTH = 512

/** Reports logged per window before the rest are counted and dropped. */
const MAX_LOGGED_PER_WINDOW = 60
const LOG_WINDOW_MS = 60_000

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

/**
 * Fixed-window log budget. Closed over per registration rather than held at
 * module scope so each built app — and so each test — starts fresh.
 */
function createLogBudget() {
  let windowStart = 0
  let logged = 0
  let dropped = 0

  return (log: FastifyBaseLogger): boolean => {
    const now = Date.now()
    if (now - windowStart >= LOG_WINDOW_MS) {
      if (dropped > 0) {
        log.warn({ dropped }, '[csp] violation reports dropped without logging — over the per-minute budget')
      }
      windowStart = now
      logged = 0
      dropped = 0
    }
    if (logged >= MAX_LOGGED_PER_WINDOW) {
      dropped += 1
      return false
    }
    logged += 1
    return true
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
  const mayLog = createLogBudget()

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

  app.post(CSP_REPORT_PATH, { bodyLimit: REPORT_BODY_LIMIT }, async (request: FastifyRequest, reply: FastifyReply) => {
    for (const raw of extractReports(request.body)) {
      const report = sanitizeReport(raw)
      if (report && mayLog(request.log)) {
        request.log.warn({ report }, '[csp] violation report')
      }
    }
    // Always 204, and never a body: the browser ignores the response, and a
    // status that varied with the content would turn this into an oracle.
    return reply.status(204).send()
  })
}
