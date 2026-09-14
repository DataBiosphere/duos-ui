import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { FETCH_METADATA_ERROR_CODE, fetchMetadataGuard } from '../src/security/fetchMetadata.js'

// ---------------------------------------------------------------------------
// Story 5-B: the Fetch Metadata positive allowlist, exercised as a matrix on a
// minimal app. The integration suites prove the guard is *wired* — on every
// upstream proxy prefix (apiProxy/ecmProxy/tdrProxy/bardProxy.test.ts, via the
// shared machinery) and on /auth/me (auth.test.ts, index.test.ts). This suite
// owns the rule itself: exactly which (Sec-Fetch-Site, Sec-Fetch-Mode) pairs
// pass, and that everything else — including the malformed shapes — fails
// closed. The rule closes the ADR-009 residual, whose attack arrives as
// same-SITE (a compromised *.broadinstitute.org sibling), so the same-site
// rows are the load-bearing ones.
// ---------------------------------------------------------------------------

describe('fetchMetadataGuard', () => {
  let app: FastifyInstance
  let handlerCalls: number

  beforeEach(async () => {
    app = Fastify({ logger: false })
    handlerCalls = 0
    app.get('/guarded', { onRequest: fetchMetadataGuard }, async () => {
      handlerCalls += 1
      return { ok: true }
    })
  })

  afterEach(async () => {
    await app.close()
  })

  const get = (headers: Record<string, string | string[]> = {}) =>
    app.inject({ method: 'GET', url: '/guarded', headers })

  describe('allows', () => {
    it.each([
      ['a same-origin cors fetch (the SPA calling its own BFF)', { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors' }],
      ['a same-origin same-origin-mode request', { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'same-origin' }],
    ])('%s', async (_name, headers) => {
      const res = await get(headers)

      expect(res.statusCode).toBe(200)
      expect(handlerCalls).toBe(1)
    })

    // Older browsers and non-browser clients send no Fetch Metadata at all.
    // Allowed by design, documented in the module: the CSRF and session
    // controls carry the load alone there, which is the pre-guard posture —
    // and a request whose headers CAN be absent is one an attacker's browser
    // cannot produce, since browsers set these forbidden headers themselves.
    it('a request with no Fetch Metadata headers (older browsers) — documented', async () => {
      const res = await get()

      expect(res.statusCode).toBe(200)
      expect(handlerCalls).toBe(1)
    })
  })

  describe('rejects with 403 and the named error', () => {
    it.each([
      // The ADR-009 attack: everything a compromised sibling subdomain sends
      // is same-SITE, in all three shapes.
      ['a same-site credentialed cors fetch (compromised sibling subdomain)', { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'cors' }],
      ['a same-site no-cors subresource (<img src>)', { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'no-cors' }],
      ['a same-site top-level navigation', { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'navigate' }],
      // Navigations are rejected regardless of site — no legitimate flow
      // navigates to a guarded path, and Lax sends the cookie on all of these.
      ['a same-origin navigation', { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'navigate' }],
      ['a cross-site navigation', { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate' }],
      ['a user-initiated navigation (site none)', { 'sec-fetch-site': 'none', 'sec-fetch-mode': 'navigate' }],
      ['a cross-site cors fetch', { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' }],
      ['a cross-site no-cors subresource', { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'no-cors' }],
      // Malformed shapes fail closed: only the genuinely absent PAIR is waved
      // through. A real browser always sends both headers or neither, so a
      // lone header in either direction is not a browser shape.
      ['a present site with a missing mode', { 'sec-fetch-site': 'same-origin' }],
      ['a present mode with a missing site', { 'sec-fetch-mode': 'cors' }],
      ['a repeated sec-fetch-site header', { 'sec-fetch-site': ['same-origin', 'same-origin'], 'sec-fetch-mode': 'cors' }],
      ['a repeated sec-fetch-mode header', { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': ['cors', 'cors'] }],
      ['an unknown mode value', { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'websocket' }],
    ])('%s', async (_name, headers) => {
      const res = await get(headers as Record<string, string | string[]>)

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: FETCH_METADATA_ERROR_CODE })
      expect(handlerCalls).toBe(0)
    })
  })

  it('applies to unsafe methods the same way', async () => {
    app.post('/guarded-post', { onRequest: fetchMetadataGuard }, async () => {
      handlerCalls += 1
      return { ok: true }
    })

    const res = await app.inject({
      method: 'POST',
      url: '/guarded-post',
      headers: { 'sec-fetch-site': 'same-site', 'sec-fetch-mode': 'cors', 'content-type': 'application/json' },
      payload: '{}',
    })

    expect(res.statusCode).toBe(403)
    expect(handlerCalls).toBe(0)
  })
})
