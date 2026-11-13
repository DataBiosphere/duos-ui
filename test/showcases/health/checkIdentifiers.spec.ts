import { describe, expect, it, vi } from 'vitest'
import { checkIdentifiers, type CheckedShowcase } from 'src/showcases/health/checkIdentifiers'
import { createHealthLookup, type HealthLookup } from 'src/showcases/health/lookup'
import { resolveShowcase } from 'src/showcases/defaults'
import { LookupRequestSchema } from 'src/showcases/schema'
import type { DatasetSummaryInput, LookupRequestInput, ShowcasePartialInput } from 'src/types/showcase'
import { createShowcaseCatalogMock, type MockDataset } from '../../fixtures/showcase/catalogMock'

const summary = (identifier: `DUOS-${number}`, accessManagement: 'open' | 'controlled', dacName = 'Example DAC'): DatasetSummaryInput =>
  ({ identifier, title: `Dataset ${identifier}`, accessManagement, dacName, consentCodes: ['GRU'], participantCount: 100, availableDate: '2026-10-01', accessUrl: null })

// DUOS-000301 is open. DUOS-000302 exists but is controlled, so the open-access shelf can't show it:
// to that shelf it is private. DUOS-000303 is open but belongs to another DAC. DUOS-000999 exists
// nowhere.
const ROWS: MockDataset[] = [
  { summary: summary('DUOS-000301', 'open'), studyId: 'study-1' },
  { summary: summary('DUOS-000302', 'controlled'), studyId: 'study-1' },
  { summary: summary('DUOS-000303', 'open', 'Other DAC'), studyId: 'study-2' },
]

const URL_ = 'https://consent.example.org/showcase/datasets'

/** The real health lookup over a fetch that answers from the synthetic catalog. Like Consent, it
 * answers 400 to a request outside the contract; the catalog mock alone accepts anything. */
const catalogLookup = (rows = ROWS) => {
  const catalog = createShowcaseCatalogMock(rows)
  const fetchMock = vi.fn<typeof fetch>(async (_url, init) => {
    const parsed = LookupRequestSchema.safeParse(JSON.parse(init?.body as string))
    if (!parsed.success) return new Response(JSON.stringify({ message: 'outside the contract' }), { status: 400, headers: { 'content-type': 'application/json' } })
    const request = parsed.data as LookupRequestInput
    return new Response(JSON.stringify(await catalog(request as never)), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  const sleep = vi.fn().mockResolvedValue(undefined)
  return { fetchMock, lookup: createHealthLookup({ url: URL_, fetch: fetchMock, retry: { attempts: 2, baseDelayMs: 1, maxDelayMs: 1, sleep } }) }
}

const sentRequests = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string) as LookupRequestInput)

const showcase = (key: string, sections: ShowcasePartialInput['sections'], status: 'live' | 'hidden' = 'live'): CheckedShowcase =>
  ({ entry: { key, status }, config: resolveShowcase({ sections }) })

const editorial = (items: `DUOS-${number}`[]): ShowcasePartialInput['sections'] => ({ 'open-access-datasets': { enabled: true, items } })

describe('checkIdentifiers', () => {
  it('gives a private identifier and a nonexistent one the same unavailable report', async () => {
    const { lookup } = catalogLookup()

    const report = await checkIdentifiers([showcase('partner', editorial(['DUOS-000301', 'DUOS-000302', 'DUOS-000999']))], lookup)

    expect(report.unavailable).toEqual([
      { showcase: 'partner', status: 'live', section: 'open-access-datasets', field: 'items', identifier: 'DUOS-000302' },
      { showcase: 'partner', status: 'live', section: 'open-access-datasets', field: 'items', identifier: 'DUOS-000999' },
    ])
    const [privateOne, missingOne] = report.unavailable
    expect({ ...privateOne, identifier: undefined }).toEqual({ ...missingOne, identifier: undefined })
    expect(report).toMatchObject({ emptyShelves: [], lookupFailures: [], lookupDisabled: false, lookupUnreachable: false })
  })

  it('reports a pin the ranking drops, from one ranking request at the maximum limit', async () => {
    const { fetchMock, lookup } = catalogLookup()
    const sections: ShowcasePartialInput['sections'] = {
      'latest-data-releases': { enabled: true, ranking: 'newest', limit: 1, pin: ['DUOS-000999', 'DUOS-000302', 'DUOS-000301'], exclude: ['DUOS-000303'] },
    }

    const report = await checkIdentifiers([showcase('partner', sections)], lookup)

    // DUOS-000302 is controlled, which this shelf may show; only the nonexistent pin is missing.
    expect(report.unavailable).toEqual([
      { showcase: 'partner', status: 'live', section: 'latest-data-releases', field: 'pin', identifier: 'DUOS-000999' },
    ])
    expect(sentRequests(fetchMock)).toEqual([
      { mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', limit: 50, pin: ['DUOS-000999', 'DUOS-000302', 'DUOS-000301'], exclude: ['DUOS-000303'] },
    ])
  })

  it('reports a pin outside the shelf scope, which the ranking drops too', async () => {
    const { lookup } = catalogLookup()
    const sections: ShowcasePartialInput['sections'] = { 'latest-data-releases': { enabled: true, ranking: 'newest', scope: { dac: ['Example DAC'] }, pin: ['DUOS-000303', 'DUOS-000301'] } }

    const report = await checkIdentifiers([showcase('partner', sections)], lookup)

    expect(report.unavailable).toEqual([
      { showcase: 'partner', status: 'live', section: 'latest-data-releases', field: 'pin', identifier: 'DUOS-000303' },
    ])
    expect(report.lookupFailures).toEqual([])
  })

  it('does not report a pin the same shelf excludes, since the config hides it', async () => {
    const { lookup } = catalogLookup()
    const sections: ShowcasePartialInput['sections'] = { 'latest-data-releases': { enabled: true, ranking: 'newest', pin: ['DUOS-000301'], exclude: ['DUOS-000301'] } }

    const report = await checkIdentifiers([showcase('partner', sections)], lookup)

    expect(report.unavailable).toEqual([])
  })

  it('reports a computed shelf that resolves empty', async () => {
    const { lookup } = catalogLookup()
    const sections: ShowcasePartialInput['sections'] = { 'latest-data-releases': { enabled: true, ranking: 'newest', scope: { dac: ['No Such DAC'] } } }

    const report = await checkIdentifiers([showcase('partner', sections, 'hidden')], lookup)

    expect(report.emptyShelves).toEqual([{ showcase: 'partner', status: 'hidden', section: 'latest-data-releases', ranking: 'newest' }])
    expect(report.unavailable).toEqual([])
  })

  it('skips disabled shelves and sends each identifier once, in batches of at most 200', async () => {
    const { fetchMock, lookup } = catalogLookup()
    const many = Array.from({ length: 201 }, (_, index) => `DUOS-${String(index + 1000).padStart(6, '0')}` as `DUOS-${number}`)
    const sections: ShowcasePartialInput['sections'] = {
      'open-access-datasets': { enabled: true, items: [...many, many[0]] },
      'latest-data-releases': { enabled: false, ranking: 'newest', pin: ['DUOS-000999'] },
    }

    const report = await checkIdentifiers([showcase('partner', sections)], lookup)

    const requests = sentRequests(fetchMock) as Array<{ identifiers: string[] }>
    expect(requests.map(request => request.identifiers.length)).toEqual([200, 1])
    expect(report.unavailable).toHaveLength(201)
  })

  it('records a refused lookup for its shelf and keeps checking the rest', async () => {
    const answers: HealthLookup = vi.fn(async (request: LookupRequestInput) =>
      request.mode === 'ranking' ? { kind: 'failed', reason: 'the lookup answered 400', unreachable: false } : { kind: 'ok', data: { datasets: [{ identifier: 'DUOS-000999', status: 'unavailable' }] } }) as never
    const sections: ShowcasePartialInput['sections'] = {
      'latest-data-releases': { enabled: true, ranking: 'newest' },
      ...editorial(['DUOS-000999']),
    }

    const report = await checkIdentifiers([showcase('partner', sections)], answers)

    expect(report.lookupFailures).toEqual([
      { showcase: 'partner', status: 'live', section: 'latest-data-releases', mode: 'ranking', reason: 'the lookup answered 400' },
    ])
    expect(report.emptyShelves).toEqual([])
    expect(report.unavailable).toHaveLength(1)
    expect(report.lookupUnreachable).toBe(false)
  })

  it('skips the remaining lookups once one fails every retry, keeping what it found before', async () => {
    const answers = vi.fn(async (request: LookupRequestInput) => request.mode === 'identifiers'
      ? { kind: 'ok', data: { datasets: [{ identifier: 'DUOS-000999', status: 'unavailable' }] } }
      : { kind: 'failed', reason: 'could not reach the lookup (timeout), after 4 attempts', unreachable: true }) as unknown as HealthLookup
    const sections: ShowcasePartialInput['sections'] = { 'latest-data-releases': { enabled: true, ranking: 'newest' } }

    const report = await checkIdentifiers([showcase('one', editorial(['DUOS-000999'])), showcase('two', sections), showcase('three', sections)], answers)

    expect(report.lookupUnreachable).toBe(true)
    expect(report.unavailable.map(finding => finding.identifier)).toEqual(['DUOS-000999'])
    expect(report.lookupFailures.map(failure => failure.showcase)).toEqual(['two'])
    expect(answers).toHaveBeenCalledTimes(2)
  })

  it('reports an editorial identifier that the answer leaves out, since the page hides it too', async () => {
    const answers = vi.fn(async () => ({ kind: 'ok', data: { datasets: [] } })) as unknown as HealthLookup

    const report = await checkIdentifiers([showcase('partner', editorial(['DUOS-000301']))], answers)

    expect(report.unavailable).toEqual([{ showcase: 'partner', status: 'live', section: 'open-access-datasets', field: 'items', identifier: 'DUOS-000301' }])
  })

  it('stops at the first 405 and reports only that the lookup is disabled', async () => {
    const answers = vi.fn(async () => ({ kind: 'disabled' })) as unknown as HealthLookup

    const report = await checkIdentifiers([showcase('one', editorial(['DUOS-000301'])), showcase('two', editorial(['DUOS-000302']))], answers)

    expect(report).toEqual({ unavailable: [], emptyShelves: [], lookupFailures: [], lookupDisabled: true, lookupUnreachable: false })
    expect(answers).toHaveBeenCalledTimes(1)
  })

  it('reports nothing when no showcase is registered', async () => {
    const { fetchMock, lookup } = catalogLookup()

    expect(await checkIdentifiers([], lookup)).toEqual({ unavailable: [], emptyShelves: [], lookupFailures: [], lookupDisabled: false, lookupUnreachable: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
