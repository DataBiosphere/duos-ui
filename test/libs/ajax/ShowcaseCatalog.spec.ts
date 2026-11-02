import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { lookupShowcaseDatasets, ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import { Config } from 'src/libs/config'
import type { LookupRequestInput } from 'src/types/showcase'
import { lookupExamples, type LookupExample } from '../../fixtures/showcase/contracts'

const SHOWCASE_ORIGIN = 'https://consent.dsde-prod.broadinstitute.org'
const LEGACY_URL = `${SHOWCASE_ORIGIN}/showcase/datasets`
const BFF_URL = '/public/showcase/datasets'

const IDENTIFIERS: Extract<LookupRequestInput, { mode: 'identifiers' }> = { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000123'] }

const accepted = lookupExamples.filter((example): example is Extract<LookupExample, { status: 200 }> => example.status === 200)

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })
}

describe('ShowcaseCatalog', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ datasets: [] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(false)
    vi.spyOn(Config, 'getShowcaseApiUrl').mockResolvedValue(SHOWCASE_ORIGIN)
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue('https://consent.dsde-dev.broadinstitute.org')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const lastInit = (): RequestInit => fetchMock.mock.calls.at(-1)?.[1] as RequestInit
  const lastHeaders = (): Record<string, string> => lastInit().headers as Record<string, string>

  describe('routing', () => {
    it('posts to the same-origin public proxy in BFF mode', async () => {
      vi.mocked(Config.isBffEnabled).mockResolvedValue(true)

      await lookupShowcaseDatasets(IDENTIFIERS)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe(BFF_URL)
      expect(Config.getShowcaseApiUrl).not.toHaveBeenCalled()
    })

    it('posts to the configured showcase origin in legacy mode', async () => {
      await lookupShowcaseDatasets(IDENTIFIERS)

      expect(fetchMock.mock.calls[0][0]).toBe(LEGACY_URL)
      expect(lastInit().method).toBe('POST')
      expect(lastInit().body).toBe(JSON.stringify(IDENTIFIERS))
    })

    it('uses only the origin of the configured value', async () => {
      vi.mocked(Config.getShowcaseApiUrl).mockResolvedValue(`${SHOWCASE_ORIGIN}/api/`)

      await lookupShowcaseDatasets(IDENTIFIERS)

      expect(fetchMock.mock.calls[0][0]).toBe(LEGACY_URL)
    })

    it.each([
      ['unset', ''],
      ['not a URL', 'consent.dsde-prod.broadinstitute.org'],
      ['not http(s)', 'ftp://consent.dsde-prod.broadinstitute.org'],
    ])('fails without a request when the legacy origin is %s, and never falls back to apiUrl', async (_, value) => {
      vi.mocked(Config.getShowcaseApiUrl).mockResolvedValue(value)

      const error = await lookupShowcaseDatasets(IDENTIFIERS).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ShowcaseLookupError)
      expect((error as ShowcaseLookupError).reason).toBe('not_configured')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(Config.getApiUrl).not.toHaveBeenCalled()
    })
  })

  describe('no credentials and no session dependency', () => {
    it.each([['BFF', true], ['legacy', false]])('omits credentials and sends no auth or CSRF header in %s mode', async (_, bff) => {
      vi.mocked(Config.isBffEnabled).mockResolvedValue(bff)

      await lookupShowcaseDatasets(IDENTIFIERS)

      expect(lastInit().credentials).toBe('omit')
      const names = Object.keys(lastHeaders()).map(name => name.toLowerCase())
      expect(names).not.toContain('authorization')
      expect(names).not.toContain('x-csrf-token')
      expect(lastHeaders()['Content-Type']).toBe('application/json')
      // The only request is the lookup itself: no /auth/csrf-token fetch.
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('passes the abort signal through', async () => {
      const controller = new AbortController()

      await lookupShowcaseDatasets(IDENTIFIERS, controller.signal)

      expect(lastInit().signal).toBe(controller.signal)
    })

    it('rethrows a cancellation unchanged', async () => {
      const controller = new AbortController()
      controller.abort()
      fetchMock.mockRejectedValue(controller.signal.reason)

      await expect(lookupShowcaseDatasets(IDENTIFIERS, controller.signal)).rejects.toBe(controller.signal.reason)
    })
  })

  describe('responses', () => {
    it.each(accepted.map(example => [example.name, example] as const))('parses the contract example: %s', async (_, example) => {
      fetchMock.mockResolvedValue(jsonResponse(example.response))

      const result = await lookupShowcaseDatasets(example.request as LookupRequestInput)

      expect(result).toEqual(example.response)
    })

    it('rejects a response that breaks the contract, such as a javascript: access URL', async () => {
      const [first] = accepted
      const unsafe = { datasets: [{ ...(first.response as { datasets: object[] }).datasets[0], accessUrl: 'javascript:alert(1)' }] }
      fetchMock.mockResolvedValue(jsonResponse(unsafe))

      const error = await lookupShowcaseDatasets(first.request as LookupRequestInput).catch((e: unknown) => e)

      expect((error as ShowcaseLookupError).reason).toBe('invalid_response')
    })

    it('rejects a body that is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } }))

      const error = await lookupShowcaseDatasets(IDENTIFIERS).catch((e: unknown) => e)

      expect((error as ShowcaseLookupError).reason).toBe('invalid_response')
    })

    it('carries the Consent message on a 400', async () => {
      const message = 'Unrecognized field "limit" for mode "stats"'
      fetchMock.mockResolvedValue(jsonResponse({ message }, { status: 400 }))

      const error = await lookupShowcaseDatasets({ mode: 'stats' }).catch((e: unknown) => e) as ShowcaseLookupError

      expect(error.reason).toBe('http')
      expect(error.status).toBe(400)
      expect(error.message).toBe(message)
    })

    it('carries Retry-After on a 429 with no body', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '17' } }))

      const error = await lookupShowcaseDatasets(IDENTIFIERS).catch((e: unknown) => e) as ShowcaseLookupError

      expect(error.status).toBe(429)
      expect(error.retryAfterSeconds).toBe(17)
    })

    it('reports a network failure as a network error', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      const error = await lookupShowcaseDatasets(IDENTIFIERS).catch((e: unknown) => e) as ShowcaseLookupError

      expect(error.reason).toBe('network')
      expect(error.status).toBeUndefined()
    })
  })
})
