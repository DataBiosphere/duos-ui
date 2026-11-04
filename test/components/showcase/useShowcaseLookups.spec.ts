import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useShowcaseLookups } from 'src/components/showcase/useShowcaseLookups'
import { lookupShowcaseDatasets, ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { LookupRequestSchema } from 'src/showcases/schema'
import type { DatasetSummaryInput, SectionKey, ShowcasePartialInput } from 'src/types/showcase'
import { createShowcaseCatalogMock, type MockDataset } from '../../fixtures/showcase/catalogMock'
import { partnerConfig } from '../../fixtures/showcase/contracts'

// Keep the real ShowcaseLookupError: an automocked class would not set `reason` or `status`.
vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))

const lookup = vi.mocked(lookupShowcaseDatasets)

const DATASET_KEYS: SectionKey[] = ['hero', 'latest-data-releases', 'open-access-datasets']

const open = (identifier: `DUOS-${number}`, title: string): DatasetSummaryInput =>
  ({ identifier, title, accessManagement: 'open', dacName: 'Example DAC', consentCodes: ['GRU'], participantCount: 100, availableDate: '2026-10-01', accessUrl: 'https://example.org/data' })

const ROWS: MockDataset[] = [
  { summary: open('DUOS-000201', 'Open One'), studyId: 'study-1' },
  { summary: open('DUOS-000202', 'Open Two'), studyId: 'study-1' },
]

const page = (sections: ShowcasePartialInput['sections']) => resolveShowcase({ sections })

const render = (config: ReturnType<typeof page>, implemented = DATASET_KEYS) =>
  renderHook(props => useShowcaseLookups(props.config, implemented), { initialProps: { config } })

beforeEach(() => {
  lookup.mockReset()
  lookup.mockImplementation(createShowcaseCatalogMock(ROWS))
})

describe('useShowcaseLookups', () => {
  it('sends one deduplicated identifiers batch and rebuilds the configured order without unavailable results', async () => {
    const { result } = render(page({ 'open-access-datasets': { enabled: true, items: ['DUOS-000202', 'DUOS-000999', 'DUOS-000201', 'DUOS-000202'] } }))

    expect(result.current.datasets['open-access-datasets']?.status).toBe('loading')
    await waitFor(() => expect(result.current.datasets['open-access-datasets']?.status).toBe('ready'))
    expect(lookup).toHaveBeenCalledTimes(1)
    expect(lookup.mock.calls[0][0]).toEqual({ mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000202', 'DUOS-000999', 'DUOS-000201'] })
    const state = result.current.datasets['open-access-datasets']
    expect(state?.status === 'ready' && state.data.map(dataset => dataset.identifier)).toEqual(['DUOS-000202', 'DUOS-000201'])
  })

  it('sends one ranking request per computed shelf with its own fields', async () => {
    const { result } = render(resolveShowcase(partnerConfig), ['latest-data-releases'])

    await waitFor(() => expect(result.current.datasets['latest-data-releases']?.status).toBe('ready'))
    expect(lookup).toHaveBeenCalledTimes(1)
    const request = lookup.mock.calls[0][0]
    expect(request).toEqual({
      mode: 'ranking',
      section: 'latest-data-releases',
      ranking: 'newest',
      scope: { dac: ['Example DAC'] },
      limit: 12,
      pin: ['DUOS-000789'],
      exclude: ['DUOS-000111'],
    })
    expect(LookupRequestSchema.safeParse(request).success).toBe(true)
  })

  it('sends a stats request with the hero scope', async () => {
    const { result } = render(resolveShowcase(partnerConfig), ['hero'])

    await waitFor(() => expect(result.current.hero?.status).toBe('ready'))
    expect(lookup.mock.calls.map(([request]) => request)).toEqual([{ mode: 'stats', scope: { dac: ['Example DAC'] } }])
    expect(result.current.hero).toMatchObject({ data: { studyCount: 1, datasetCount: 2 } })
  })

  it('makes no request for disabled or unimplemented sections, or sections with nothing to look up', () => {
    const config = page({
      'latest-data-releases': { enabled: false, ranking: 'newest' },
      'open-access-datasets': { enabled: true, items: ['DUOS-000201'] },
      'hero': { enabled: true, intro: '', stats: ['tools'], announcements: [], onboarding: [], primaryCtas: [] },
    })
    const { result } = render(config, ['hero', 'latest-data-releases'])

    expect(lookup).not.toHaveBeenCalled()
    expect(result.current).toEqual({ datasets: {} })
  })

  it('exposes a failure and re-issues only that request on retry', async () => {
    const real = createShowcaseCatalogMock(ROWS)
    lookup.mockImplementation(request => request.mode === 'stats'
      ? Promise.reject(new ShowcaseLookupError('network', 'down'))
      : real(request))
    const { result } = render(page({
      'latest-data-releases': { enabled: true, ranking: 'newest' },
      'hero': { enabled: true, intro: '', stats: ['studies'], announcements: [], onboarding: [], primaryCtas: [] },
    }))

    await waitFor(() => expect(result.current.hero?.status).toBe('error'))
    expect(result.current.hero).toMatchObject({ error: { reason: 'network' } })
    expect(lookup).toHaveBeenCalledTimes(2)

    lookup.mockImplementation(real)
    act(() => result.current.hero?.retry())
    expect(result.current.hero?.status).toBe('loading')
    await waitFor(() => expect(result.current.hero?.status).toBe('ready'))
    expect(lookup).toHaveBeenCalledTimes(3)
    expect(lookup.mock.calls[2][0]).toEqual({ mode: 'stats' })
  })

  it('exposes the status and Retry-After of a 429', async () => {
    lookup.mockRejectedValue(new ShowcaseLookupError('http', 'Too many requests', { status: 429, retryAfterSeconds: 30 }))
    const { result } = render(page({ 'latest-data-releases': { enabled: true, ranking: 'newest' } }))

    await waitFor(() => expect(result.current.datasets['latest-data-releases']?.status).toBe('error'))
    const state = result.current.datasets['latest-data-releases']
    expect(state?.status === 'error' && state.error).toMatchObject({ reason: 'http', status: 429, retryAfterSeconds: 30 })
  })

  it('keeps the same lookups and retry functions across renders until a state changes', async () => {
    const sections = { 'latest-data-releases': { enabled: true, ranking: 'newest' } } as const
    const { result, rerender } = render(page(sections))
    await waitFor(() => expect(result.current.datasets['latest-data-releases']?.status).toBe('ready'))
    const ready = result.current

    // A fresh but equal config, as a page passes on every render.
    rerender({ config: page(sections) })
    expect(result.current).toBe(ready)
    expect(result.current.datasets['latest-data-releases']?.retry).toBe(ready.datasets['latest-data-releases']?.retry)

    act(() => result.current.datasets['latest-data-releases']?.retry())
    expect(result.current).not.toBe(ready)
  })

  it('aborts in-flight requests on unmount and on a config change without an error state', async () => {
    const signals: AbortSignal[] = []
    lookup.mockImplementation((_request, signal) => new Promise((_resolve, reject) => {
      signals.push(signal!)
      signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    const first = page({ 'latest-data-releases': { enabled: true, ranking: 'newest' } })
    const { result, rerender, unmount } = render(first)
    expect(signals).toHaveLength(1)

    // A fresh object with the same requests does not re-fetch.
    rerender({ config: page({ 'latest-data-releases': { enabled: true, ranking: 'newest' } }) })
    expect(signals).toHaveLength(1)

    rerender({ config: page({ 'latest-data-releases': { enabled: true, ranking: 'newest', limit: 6 } }) })
    expect(signals[0].aborted).toBe(true)
    await act(async () => {})
    expect(result.current.datasets['latest-data-releases']?.status).toBe('loading')

    unmount()
    expect(signals[1].aborted).toBe(true)
    await act(async () => {})
    expect(result.current.datasets['latest-data-releases']?.status).toBe('loading')
  })

  it('never shows an earlier result for a changed or revisited plan', async () => {
    const seen: (string | undefined)[] = []
    const { result, rerender } = renderHook((props) => {
      const lookups = useShowcaseLookups(props.config, DATASET_KEYS)
      const state = lookups.datasets['latest-data-releases']
      seen.push(state?.status === 'ready' ? `ready:${state.data.length}` : state?.status)
      return lookups
    }, { initialProps: { config: page({ 'latest-data-releases': { enabled: true, ranking: 'newest' } }) } })
    await waitFor(() => expect(result.current.datasets['latest-data-releases']?.status).toBe('ready'))

    // A changed request: the first render under it must not report the previous result.
    seen.length = 0
    rerender({ config: page({ 'latest-data-releases': { enabled: true, ranking: 'newest', limit: 1 } }) })
    expect(seen[0]).toBe('loading')
    await waitFor(() => expect(seen.at(-1)).toBe('ready:1'))

    // Disabled, then re-enabled with the same request: no render shows the old data before the new lookup.
    rerender({ config: page({ 'latest-data-releases': { enabled: false } }) })
    seen.length = 0
    lookup.mockImplementation(() => new Promise(() => {}))
    rerender({ config: page({ 'latest-data-releases': { enabled: true, ranking: 'newest', limit: 1 } }) })
    await act(async () => {})
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every(status => status === 'loading')).toBe(true)
  })
})
