import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { CSP_REPORT_GROUP, CSP_REPORT_PATH } from '../src/security/csp.js'
import { REPORTING_ENDPOINTS_HEADER, REPORT_BODY_LIMIT, cspReportRoute, extractReports, sanitizeReport } from '../src/security/cspReport.js'

const CSP_REPORT_TYPE = 'application/csp-report'
const REPORTS_JSON_TYPE = 'application/reports+json'

/** A report body as a browser sends it under `report-uri`. */
const reportUriBody = (overrides: Record<string, unknown> = {}) => ({
  'csp-report': {
    'document-uri': 'https://duos.broadinstitute.org/datalibrary',
    'referrer': '',
    'violated-directive': 'connect-src',
    'effective-directive': 'connect-src',
    'original-policy': 'default-src \'self\'; connect-src \'self\'',
    'disposition': 'report',
    'blocked-uri': 'https://example.org/tracker.json',
    'status-code': 200,
    ...overrides,
  },
})

/** The same violation as a browser sends it under `report-to`. */
const reportsJsonBody = () => ([
  {
    type: 'csp-violation',
    url: 'https://duos.broadinstitute.org/datalibrary',
    body: {
      documentURL: 'https://duos.broadinstitute.org/datalibrary',
      effectiveDirective: 'connect-src',
      blockedURL: 'https://example.org/tracker.json',
      disposition: 'report',
      statusCode: 200,
    },
  },
  // A batch can mix report types; only the CSP ones are ours.
  { type: 'deprecation', url: 'https://duos.broadinstitute.org/', body: { id: 'AnyId' } },
])

describe('sanitizeReport', () => {
  it('keeps the spec fields in either spelling', () => {
    expect(sanitizeReport({ 'blocked-uri': 'https://example.org/x', 'status-code': 200 }))
      .toEqual({ 'blocked-uri': 'https://example.org/x', 'status-code': 200 })
    expect(sanitizeReport({ blockedURL: 'https://example.org/x', statusCode: 200 }))
      .toEqual({ blockedURL: 'https://example.org/x', statusCode: 200 })
  })

  it('drops fields outside the allowlist, so an attacker cannot choose what is logged', () => {
    expect(sanitizeReport({ 'blocked-uri': 'https://example.org/x', 'note': 'a'.repeat(100_000) }))
      .toEqual({ 'blocked-uri': 'https://example.org/x' })
  })

  it('truncates a long value', () => {
    const report = sanitizeReport({ 'blocked-uri': 'x'.repeat(2000) })
    expect(String(report?.['blocked-uri'])).toHaveLength(513)
    expect(String(report?.['blocked-uri']).endsWith('…')).toBe(true)
  })

  it('flattens control characters so one report cannot become many log lines', () => {
    expect(sanitizeReport({ referrer: 'a\nb\r\tc' })).toEqual({ referrer: 'a b  c' })
  })

  it('drops values that are neither a string nor a finite number', () => {
    expect(sanitizeReport({ 'blocked-uri': { nested: true }, 'status-code': Number.NaN, 'referrer': 'ok' }))
      .toEqual({ referrer: 'ok' })
  })

  it.each([
    ['a non-object', 'just a string'],
    ['null', null],
    ['an array', ['a']],
    ['an object with no allowlisted field', { hello: 'world' }],
  ])('returns undefined for %s', (_label, raw) => {
    expect(sanitizeReport(raw)).toBeUndefined()
  })
})

describe('extractReports', () => {
  it('unwraps the single report-uri shape', () => {
    expect(extractReports(reportUriBody())).toHaveLength(1)
  })

  it('takes only the csp-violation entries out of a report-to batch', () => {
    const reports = extractReports(reportsJsonBody())
    expect(reports).toHaveLength(1)
    expect(reports[0]).toHaveProperty('effectiveDirective', 'connect-src')
  })

  it.each([
    ['an unrecognised object', { hello: 'world' }],
    ['an empty batch', []],
    ['a string', 'nonsense'],
    ['null', null],
  ])('yields nothing for %s', (_label, body) => {
    expect(extractReports(body)).toEqual([])
  })
})

describe(`POST ${CSP_REPORT_PATH}`, () => {
  let app: FastifyInstance
  let warn: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    app = Fastify({ logger: false })
    warn = vi.fn()
    // The route logs through request.log; replace just that method.
    app.addHook('onRequest', async (request) => {
      request.log.warn = warn as unknown as typeof request.log.warn
    })
    await app.register(cspReportRoute)
  })

  afterEach(async () => {
    await app.close()
  })

  it('answers 204 with no body and logs the sanitised report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': CSP_REPORT_TYPE },
      payload: JSON.stringify(reportUriBody()),
    })

    expect(res.statusCode).toBe(204)
    expect(res.body).toBe('')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toEqual({
      report: expect.objectContaining({ 'blocked-uri': 'https://example.org/tracker.json' }),
    })
  })

  it('accepts the report-to media type and logs only the CSP entry of a mixed batch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': REPORTS_JSON_TYPE },
      payload: JSON.stringify(reportsJsonBody()),
    })

    expect(res.statusCode).toBe(204)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it.each(['application/json', 'text/plain', 'application/x-www-form-urlencoded'])(
    'rejects %s with 415 before any handler runs',
    async (contentType) => {
      const res = await app.inject({
        method: 'POST',
        url: CSP_REPORT_PATH,
        headers: { 'content-type': contentType },
        payload: JSON.stringify(reportUriBody()),
      })

      expect(res.statusCode).toBe(415)
      expect(warn).not.toHaveBeenCalled()
    },
  )

  it('rejects a body over the limit with 413', async () => {
    const res = await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': CSP_REPORT_TYPE },
      payload: JSON.stringify(reportUriBody({ 'script-sample': 'x'.repeat(REPORT_BODY_LIMIT) })),
    })

    expect(res.statusCode).toBe(413)
    expect(warn).not.toHaveBeenCalled()
  })

  it('answers 204 and logs nothing for a malformed body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': CSP_REPORT_TYPE },
      payload: 'not json at all',
    })

    expect(res.statusCode).toBe(204)
    expect(warn).not.toHaveBeenCalled()
  })

  it('caps how many reports it logs per minute, and still answers 204 over the cap', async () => {
    const payload = JSON.stringify(reportUriBody())
    for (let i = 0; i < 70; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: CSP_REPORT_PATH,
        headers: { 'content-type': CSP_REPORT_TYPE },
        payload,
      })
      expect(res.statusCode).toBe(204)
    }
    expect(warn).toHaveBeenCalledTimes(60)
  })

  it('re-opens the budget, and reports what it dropped, once the window rolls over', async () => {
    // Only Date is faked: the budget reads Date.now(), and faking the timer
    // queue as well would stall inject()'s own internals.
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const payload = JSON.stringify(reportUriBody())
      const post = () => app.inject({
        method: 'POST',
        url: CSP_REPORT_PATH,
        headers: { 'content-type': CSP_REPORT_TYPE },
        payload,
      })

      for (let i = 0; i < 61; i += 1) await post()
      expect(warn).toHaveBeenCalledTimes(60)

      vi.advanceTimersByTime(60_001)
      await post()

      // The rollover reports the drop, then the fresh window logs the report.
      expect(warn).toHaveBeenCalledTimes(62)
      expect(warn.mock.calls[60][0]).toEqual({ dropped: 1 })
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('leaves the surrounding app\'s own parsers alone', async () => {
    // removeAllContentTypeParsers() runs inside this plugin's encapsulation
    // context; a sibling route must still parse JSON.
    const sibling = Fastify({ logger: false })
    await sibling.register(cspReportRoute)
    sibling.post('/elsewhere', async request => request.body)

    const res = await sibling.inject({
      method: 'POST',
      url: '/elsewhere',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ ok: true }),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
    await sibling.close()
  })
})

describe('REPORTING_ENDPOINTS_HEADER', () => {
  it('names the policy group and the sink path', () => {
    expect(REPORTING_ENDPOINTS_HEADER).toBe(`${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`)
  })
})
