import { describe, expect, it, vi } from 'vitest'
import { createHealthLookup, DEFAULT_LOOKUP_ORIGIN, lookupUrl } from 'src/showcases/health/lookup'
import type { LookupRequestInput } from 'src/types/showcase'

const URL_ = 'https://consent.example.org/showcase/datasets'
const IDENTIFIERS: Extract<LookupRequestInput, { mode: 'identifiers' }> = { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000123', 'DUOS-000999'] }
const RANKING: Extract<LookupRequestInput, { mode: 'ranking' }> = { mode: 'ranking', section: 'latest-data-releases', ranking: 'newest' }

const SUMMARY = { identifier: 'DUOS-000123', title: 'Example Cohort', accessManagement: 'open', dacName: null, consentCodes: ['GRU'], participantCount: 10, availableDate: '2026-09-30', accessUrl: null }

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

const setup = (...responses: Array<Response | Error>) => {
  const fetchMock = vi.fn<typeof fetch>()
  responses.forEach(response => response instanceof Error ? fetchMock.mockRejectedValueOnce(response) : fetchMock.mockResolvedValueOnce(response))
  const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined)
  const lookup = createHealthLookup({ url: URL_, fetch: fetchMock, retry: { attempts: 3, baseDelayMs: 10, maxDelayMs: 1_000, sleep } })
  return { fetchMock, sleep, lookup }
}

describe('lookupUrl', () => {
  it('defaults to production Consent', () => {
    expect(lookupUrl(undefined)).toBe(`${DEFAULT_LOOKUP_ORIGIN}/showcase/datasets`)
    expect(lookupUrl('  ')).toBe(`${DEFAULT_LOOKUP_ORIGIN}/showcase/datasets`)
  })

  it('keeps only the origin of a configured URL', () => {
    expect(lookupUrl('https://consent.dsde-dev.broadinstitute.org/api/other?x=1')).toBe('https://consent.dsde-dev.broadinstitute.org/showcase/datasets')
  })

  it.each(['not a url', 'ftp://consent.example.org', 'javascript:alert(1)'])('rejects %j', (value) => {
    expect(() => lookupUrl(value)).toThrow(/showcase lookup URL/)
  })
})

describe('createHealthLookup', () => {
  it('posts the request anonymously as JSON', async () => {
    const { fetchMock, lookup } = setup(json({ datasets: [SUMMARY] }))

    await lookup(IDENTIFIERS)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(URL_)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual(IDENTIFIERS)
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json', 'Accept': 'application/json' })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('returns the parsed response for its mode', async () => {
    const { lookup } = setup(json({ datasets: [SUMMARY, { identifier: 'DUOS-000999', status: 'unavailable' }] }))

    expect(await lookup(IDENTIFIERS)).toEqual({ kind: 'ok', data: { datasets: [SUMMARY, { identifier: 'DUOS-000999', status: 'unavailable' }] } })
  })

  it('reports a 405 as disabled, without retrying', async () => {
    const { fetchMock, lookup } = setup(new Response(null, { status: 405 }))

    expect(await lookup(IDENTIFIERS)).toEqual({ kind: 'disabled' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a 503', new Response(null, { status: 503 })],
    ['a 408', new Response(null, { status: 408 })],
    ['a 429', new Response(null, { status: 429 })],
    ['a network error', new TypeError('fetch failed')],
  ])('retries %s before answering', async (_, first) => {
    const { fetchMock, lookup } = setup(first, json({ datasets: [] }))

    expect(await lookup(RANKING)).toEqual({ kind: 'ok', data: { datasets: [] } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('waits for the Retry-After of a 429', async () => {
    const { sleep, lookup } = setup(new Response(null, { status: 429, headers: { 'retry-after': '3' } }), json({ datasets: [] }))

    await lookup(RANKING)

    expect(sleep).toHaveBeenCalledWith(1_000)
  })

  it('fails once the retries run out, with the last reason', async () => {
    const { fetchMock, lookup } = setup(new Response(null, { status: 502 }), new Response(null, { status: 503 }), new Response(null, { status: 504 }))

    expect(await lookup(RANKING)).toEqual({ kind: 'failed', reason: 'the lookup answered 504, after 3 attempts', unreachable: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('fails a 400 at once', async () => {
    const { fetchMock, lookup } = setup(json({ message: 'identifiers exceeds 200' }, 400))

    expect(await lookup(IDENTIFIERS)).toEqual({ kind: 'failed', reason: 'the lookup answered 400', unreachable: false })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries a response whose body is cut off', async () => {
    const cutOff = new Response(new ReadableStream({ pull: controller => controller.error(new TypeError('terminated')) }), { status: 200 })
    const { fetchMock, lookup } = setup(cutOff, json({ datasets: [] }))

    expect(await lookup(RANKING)).toEqual({ kind: 'ok', data: { datasets: [] } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not follow a redirect, so a 405 behind one never reads as disabled', async () => {
    const { fetchMock, lookup } = setup(new Response(null, { status: 301, headers: { location: 'https://consent.example.org/showcase/datasets' } }))

    expect(await lookup(IDENTIFIERS)).toEqual({ kind: 'failed', reason: 'the lookup redirected with 301', unreachable: false })
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe('manual')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fails a body that is not JSON', async () => {
    const { lookup } = setup(new Response('<html>', { status: 200 }))

    expect(await lookup(IDENTIFIERS)).toEqual({ kind: 'failed', reason: 'the lookup returned a body that is not JSON', unreachable: false })
  })

  it('fails a response outside the contract for its mode', async () => {
    // A ranking response never carries an unavailable result.
    const { lookup } = setup(json({ datasets: [{ identifier: 'DUOS-000999', status: 'unavailable' }] }))

    expect(await lookup(RANKING)).toEqual({ kind: 'failed', reason: 'the lookup returned a response outside the contract', unreachable: false })
  })
})
