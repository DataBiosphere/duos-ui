import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyRateLimit from '@fastify/rate-limit'
import { CSP_REPORT_GROUP, CSP_REPORT_PATH, MAX_REPORTS_PER_REQUEST, MAX_REQUESTS_PER_WINDOW, REPORTING_ENDPOINTS_HEADER, REPORT_BODY_LIMIT, cspReportRoute, extractReports, sanitizeReport } from '../src/security/cspReport.js'

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

/**
 * `count` minimal but entirely well-formed report-to entries — one allowlisted
 * field each, so every one of them survives sanitising. Neither parser checks
 * the body's shape, so this is what an attacker packs an 8 KB body with.
 */
const batchOf = (count: number) =>
  Array.from({ length: count }, () => ({ type: 'csp-violation', body: { sample: 'x' } }))

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

  it('redacts the query string of the OAuth callback URL, in both spellings', () => {
    const callback = 'https://duos.broadinstitute.org/redirect-from-oauth?code=SECRET_CODE&state=SECRET_STATE'
    expect(sanitizeReport({ 'document-uri': callback, 'referrer': callback }))
      .toEqual({
        'document-uri': 'https://duos.broadinstitute.org/redirect-from-oauth?<redacted>',
        'referrer': 'https://duos.broadinstitute.org/redirect-from-oauth?<redacted>',
      })
    expect(sanitizeReport({ documentURL: callback }))
      .toEqual({ documentURL: 'https://duos.broadinstitute.org/redirect-from-oauth?<redacted>' })
  })

  it('redacts the query string of every URL-valued field', () => {
    expect(sanitizeReport({
      'blocked-uri': 'https://example.org/t.json?token=abc',
      'source-file': 'https://duos.broadinstitute.org/main.js?v=1',
      'blockedURL': 'https://example.org/t.json?token=abc',
      'sourceFile': 'https://duos.broadinstitute.org/main.js?v=1',
    })).toEqual({
      'blocked-uri': 'https://example.org/t.json?<redacted>',
      'source-file': 'https://duos.broadinstitute.org/main.js?<redacted>',
      'blockedURL': 'https://example.org/t.json?<redacted>',
      'sourceFile': 'https://duos.broadinstitute.org/main.js?<redacted>',
    })
  })

  it('redacts a fragment as well, since a fragment can carry OAuth material too', () => {
    expect(sanitizeReport({ 'document-uri': 'https://duos.broadinstitute.org/x#id_token=SECRET' }))
      .toEqual({ 'document-uri': 'https://duos.broadinstitute.org/x?<redacted>' })
  })

  it('leaves URL fields that carry no query alone, keywords included', () => {
    expect(sanitizeReport({ 'blocked-uri': 'inline', 'document-uri': 'https://duos.broadinstitute.org/datalibrary' }))
      .toEqual({ 'blocked-uri': 'inline', 'document-uri': 'https://duos.broadinstitute.org/datalibrary' })
  })

  it('does not redact fields that are not URLs', () => {
    expect(sanitizeReport({ 'original-policy': 'default-src \'self\'; report-uri /csp-report?x=1' }))
      .toEqual({ 'original-policy': 'default-src \'self\'; report-uri /csp-report?x=1' })
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
  let post: (contentType: string, payload: string) => Promise<{ statusCode: number, body: string }>

  beforeEach(async () => {
    app = Fastify({ logger: false })
    warn = vi.fn()
    // Every line the route writes — the report lines and the dropped tally —
    // goes through `app.log`, because `logLevel: 'silent'` silences
    // `request.log` for this route. Stubbing `app.log.warn` therefore captures
    // all of them.
    app.log.warn = warn as unknown as typeof app.log.warn
    await app.register(cspReportRoute)

    post = (contentType, payload) => app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': contentType },
      payload,
    })
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
      // The route logs through app.log, so the request id is carried by hand:
      // it is what tells which lines of a batch arrived together.
      reqId: expect.any(String),
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

  it('logs no more than the per-request cap out of one batch', async () => {
    const res = await post(REPORTS_JSON_TYPE, JSON.stringify(batchOf(MAX_REPORTS_PER_REQUEST + 12)))

    expect(res.statusCode).toBe(204)
    expect(warn).toHaveBeenCalledTimes(MAX_REPORTS_PER_REQUEST)
  })

  it('charges one oversized batch a single unit of budget, so a later client is still logged', async () => {
    // 100 well-formed entries fit inside the 8 KB limit with room to spare.
    // Charged per report, this one request would have spent the whole window
    // and silenced every genuine violation report for the next minute.
    const flood = JSON.stringify(batchOf(100))
    expect(Buffer.byteLength(flood)).toBeLessThan(REPORT_BODY_LIMIT)

    expect((await post(REPORTS_JSON_TYPE, flood)).statusCode).toBe(204)
    expect(warn).toHaveBeenCalledTimes(MAX_REPORTS_PER_REQUEST)

    // One unit spent, 59 left: the 60th request after the flood is the first
    // the budget refuses, not the first one.
    const payload = JSON.stringify(reportUriBody())
    for (let i = 0; i < 59; i += 1) await post(CSP_REPORT_TYPE, payload)
    expect(warn).toHaveBeenCalledTimes(MAX_REPORTS_PER_REQUEST + 59)

    await post(CSP_REPORT_TYPE, payload)
    expect(warn).toHaveBeenCalledTimes(MAX_REPORTS_PER_REQUEST + 59)
  })

  it('writes the dropped count on close, so a flood followed by silence does not lose it', async () => {
    // Nothing rolls the window over here: without the close flush an operator
    // would see 60 ordinary report lines and no sign of the two discarded.
    const payload = JSON.stringify(reportUriBody())
    for (let i = 0; i < 62; i += 1) await post(CSP_REPORT_TYPE, payload)
    expect(warn).toHaveBeenCalledTimes(60)

    await app.close()

    expect(warn).toHaveBeenCalledTimes(61)
    expect(warn.mock.calls[60][0]).toEqual({ dropped: 2 })
  })

  it('answers 415 and 413 with a bare status, naming no framework error code', async () => {
    // index.ts installs its error handler after this plugin registers, so the
    // app-level generalisation never reaches this route; the plugin declares
    // its own. Bare bodies, not FST_ERR_CTP_* on an unauthenticated endpoint.
    const wrongType = await post('application/json', JSON.stringify(reportUriBody()))
    const tooLarge = await post(CSP_REPORT_TYPE, JSON.stringify(reportUriBody({ 'script-sample': 'x'.repeat(REPORT_BODY_LIMIT) })))

    expect(wrongType.statusCode).toBe(415)
    expect(tooLarge.statusCode).toBe(413)
    for (const res of [wrongType, tooLarge]) {
      expect(res.body).toBe('')
      expect(res.body).not.toContain('FST_ERR')
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

describe(`${CSP_REPORT_PATH} request logging`, () => {
  let app: FastifyInstance
  let lines: string[]

  /** The `msg` of every line the real logger has written since the last read. */
  const drainMessages = () => lines.splice(0).map(line => String(JSON.parse(line).msg))

  beforeEach(async () => {
    lines = []
    // A real logger at the level index.ts builds — Fastify's own request
    // logging is what is under test, and `logger: false` would hide it.
    const stream = {
      write: (line: string) => {
        lines.push(line)
      },
    }
    app = Fastify({ logger: { level: 'info', stream } })
    await app.register(cspReportRoute)
    app.post('/elsewhere', async (_request, reply) => reply.send('ok'))
    await app.ready()
    lines.length = 0
  })

  afterEach(async () => {
    await app.close()
  })

  it('emits the report line but neither of Fastify\'s own per-request lines', async () => {
    await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': CSP_REPORT_TYPE },
      payload: JSON.stringify(reportUriBody()),
    })

    expect(drainMessages()).toEqual(['[csp] violation report'])
  })

  it('writes nothing at all for a request rejected before the handler runs', async () => {
    // 415 and 413 are answered by Fastify itself; only the route's log level
    // keeps them from writing a line each, at whatever rate they arrive.
    await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    })
    await app.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': CSP_REPORT_TYPE },
      payload: 'x'.repeat(REPORT_BODY_LIMIT + 1),
    })

    expect(drainMessages()).toEqual([])
  })

  it('still logs both per-request lines for a route without the option, so the logger itself is not the reason', async () => {
    await app.inject({ method: 'POST', url: '/elsewhere', payload: '' })

    expect(drainMessages()).toEqual(['incoming request', 'request completed'])
  })

  it('honours a logger configured below warn, rather than pinning this route above it', async () => {
    // The report lines go through app.log for exactly this reason. A route
    // level pins rather than raises, so logging them through request.log at
    // `warn` would have overridden a deployment that asked for silence.
    const quiet = Fastify({ logger: { level: 'error', stream: { write: (line: string) => lines.push(line) } } })
    await quiet.register(cspReportRoute)
    await quiet.ready()
    lines.length = 0

    await quiet.inject({
      method: 'POST',
      url: CSP_REPORT_PATH,
      headers: { 'content-type': CSP_REPORT_TYPE },
      payload: JSON.stringify(reportUriBody()),
    })

    expect(drainMessages()).toEqual([])
    await quiet.close()
  })
})

describe(`POST ${CSP_REPORT_PATH} under the rate limit`, () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
    // As index.ts registers it: global: false, because this instance also
    // serves every SPA asset. The route carries its own config.
    await app.register(fastifyRateLimit, { global: false })
    await app.register(cspReportRoute)
  })

  afterEach(async () => {
    await app.close()
  })

  const post = () => app.inject({
    method: 'POST',
    url: CSP_REPORT_PATH,
    headers: { 'content-type': CSP_REPORT_TYPE },
    payload: JSON.stringify(reportUriBody()),
  })

  it('refuses a client over the limit with 429, rather than parsing every request it is sent', async () => {
    // The log budget bounds what gets written; on its own it still reads and
    // JSON-parses an unlimited number of requests. This is the other half.
    const accepted = []
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i += 1) accepted.push((await post()).statusCode)
    const refused = await post()

    expect(accepted.every(status => status === 204)).toBe(true)
    expect(refused.statusCode).toBe(429)
  })

  it('answers the refusal with no body, naming neither the plugin nor the retry window', async () => {
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i += 1) await post()
    const refused = await post()

    // Bare, like the 415 and 413 above: the plugin throws the builder's return
    // and the route's error handler answers with the status alone.
    expect(refused.body).toBe('')
    expect(refused.headers['content-type']).toBeUndefined()
  })

  it('leaves the limit off the routes around it, so SPA assets are unaffected', async () => {
    // `global: false` is the whole reason: a page load fetches many assets,
    // and a global cap sized for this endpoint would block one.
    app.get('/asset', async () => ({ ok: true }))
    await app.ready()

    const statuses = []
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW + 5; i += 1) {
      statuses.push((await app.inject({ method: 'GET', url: '/asset' })).statusCode)
    }

    expect(statuses.every(status => status === 200)).toBe(true)
  })
})

describe('REPORTING_ENDPOINTS_HEADER', () => {
  it('names the policy group and the sink path', () => {
    expect(REPORTING_ENDPOINTS_HEADER).toBe(`${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`)
  })
})
