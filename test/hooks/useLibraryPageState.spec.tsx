import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLibraryPageState } from 'src/hooks/useLibraryPageState'
import { AssetType, FilterState, LibraryVersionNew } from 'src/types/library'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { useLibraryData, useLibraryMetadata } from 'src/hooks/useLibraryData'
import { useLibraryTabCounts } from 'src/hooks/useLibraryTabCounts'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'

vi.mock('src/hooks/useLibraryData')
vi.mock('src/hooks/useLibraryTabCounts')
vi.mock('src/hooks/useLibraryUrlState')

const libraryConfig: LibraryVersionNew = {
  key: 'duos',
  title: 'DUOS Data Library',
  featured: true,
  order: 0,
}

// A shared counts response whose aggregations yield 3 studies and 4 models via
// computeTabCounts (the hook now returns the raw response; counts are derived
// at render time with the current filters).
const makeModelsBucket = (studyId: number, modelCount: number) => ({
  key: studyId,
  study_details: {
    hits: {
      hits: [{
        _source: {
          study: {
            studyId,
            studyName: `Study ${studyId}`,
            assets: { models: Array.from({ length: modelCount }, (_, i) => ({ name: `M${i}` })) },
          },
        },
      }],
    },
  },
})

const tabCountsResponse = {
  aggregations: {
    total_studies: { value: 3 },
    datasets_count: { doc_count: 7 },
    studies: { buckets: [makeModelsBucket(1, 4)] },
  },
}

const updateUrlState = vi.fn()

const setup = (tab: AssetType, filters: FilterState = EMPTY_FILTERS) => {
  vi.mocked(useLibraryUrlState).mockReturnValue([
    { library: 'duos', tab, filters, query: '', page: 0, pageSize: 25, hideFilters: false },
    updateUrlState,
  ] as unknown as ReturnType<typeof useLibraryUrlState>)
}

beforeEach(() => {
  updateUrlState.mockReset()
  vi.mocked(useLibraryMetadata).mockReturnValue({ data: {}, isLoading: false } as unknown as ReturnType<typeof useLibraryMetadata>)
  vi.mocked(useLibraryData).mockReturnValue({
    data: { items: [], total: 0, aggregations: {} },
    isFetching: false,
    error: null,
  } as unknown as ReturnType<typeof useLibraryData>)
  vi.mocked(useLibraryTabCounts).mockReturnValue({
    data: tabCountsResponse,
    isFetching: false,
    error: null,
  } as unknown as ReturnType<typeof useLibraryTabCounts>)
})

describe('useLibraryPageState — tab-count wiring', () => {
  it('derives tab counts from the shared counts response on a study-asset tab', () => {
    setup(AssetType.MODELS)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.tabCounts?.[AssetType.STUDIES]).toBe(3)
    expect(result.current.tabCounts?.[AssetType.DATASETS]).toBe(7)
    expect(result.current.tabCounts?.[AssetType.MODELS]).toBe(4)
    // The counts query is keyed only on (libraryConfig, filters, queryTerm) — no
    // active tab, pagination or sort — so it is shared across tabs.
    expect(vi.mocked(useLibraryTabCounts).mock.calls.at(-1)).toEqual([libraryConfig, EMPTY_FILTERS, ''])
  })

  it('derives tab counts from the same shared response on the Studies tab', () => {
    setup(AssetType.STUDIES)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.tabCounts?.[AssetType.STUDIES]).toBe(3)
    expect(result.current.tabCounts?.[AssetType.MODELS]).toBe(4)
    expect(vi.mocked(useLibraryTabCounts).mock.calls.at(-1)).toEqual([libraryConfig, EMPTY_FILTERS, ''])
  })
})

describe('useLibraryPageState — request sharing', () => {
  const dataQueryOptions = () => vi.mocked(useLibraryData).mock.calls.at(-1)?.[6]

  it('disables the per-tab data query on a study-asset tab so the grid reuses the shared counts response', () => {
    setup(AssetType.MODELS)
    renderHook(() => useLibraryPageState(libraryConfig))
    expect(dataQueryOptions()).toEqual({ enabled: false })
  })

  it('keeps its own data query enabled on the Studies and Datasets tabs', () => {
    setup(AssetType.STUDIES)
    renderHook(() => useLibraryPageState(libraryConfig))
    expect(dataQueryOptions()).toEqual({ enabled: true })

    vi.mocked(useLibraryData).mockClear()
    setup(AssetType.DATASETS)
    renderHook(() => useLibraryPageState(libraryConfig))
    expect(dataQueryOptions()).toEqual({ enabled: true })
  })

  it('derives the study-asset grid rows from the shared counts response', () => {
    setup(AssetType.MODELS)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))
    // modelAsset.transformResponse flattens the nested models from the shared
    // counts response — no separate data query needed.
    expect(result.current.data?.items).toHaveLength(4)
  })
})

describe('useLibraryPageState — filter handlers', () => {
  it('keeps the full filter set when switching tabs but clears the tab-specific sort', () => {
    setup(AssetType.MODELS, { ...EMPTY_FILTERS, accessManagement: ['controlled'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    act(() => result.current.handleTabChange(AssetType.PUBLICATIONS))

    // No filters key means the existing filters are left untouched; the explicit
    // undefined sort keys delete the sort params so a sort field from one tab is
    // never sent to Elasticsearch on a tab whose documents don't have it.
    expect(updateUrlState).toHaveBeenCalledWith({
      tab: AssetType.PUBLICATIONS,
      page: 0,
      sortField: undefined,
      sortOrder: undefined,
    })
    expect(Object.keys(updateUrlState.mock.calls.at(-1)![0])).toContain('sortField')
  })

  it('resets to the first page when filters change', () => {
    setup(AssetType.PUBLICATIONS)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    act(() => result.current.handleFiltersChange({ ...EMPTY_FILTERS, accessManagement: ['open'] }))

    // Without the reset, narrowing the results while on page > 0 can leave the
    // page index past the end of the new result set (empty grid, nonzero badge).
    expect(updateUrlState).toHaveBeenCalledWith({
      filters: expect.objectContaining({ accessManagement: ['open'] }),
      page: 0,
    })
  })

  it('surfaces filters owned by other tabs as external chips', () => {
    // Models renders no filters of its own, so an active accessManagement filter is external.
    setup(AssetType.MODELS, { ...EMPTY_FILTERS, accessManagement: ['controlled'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.externalFilters.map(chip => chip.key)).toContain('accessManagement')
  })

  it('handleRemoveExternalFilter drops only the targeted value from the filter state', () => {
    setup(AssetType.MODELS, { ...EMPTY_FILTERS, accessManagement: ['controlled', 'open'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    act(() => result.current.handleRemoveExternalFilter({
      key: 'accessManagement',
      sectionLabel: 'Access Request Process',
      valueLabel: 'controlled',
      value: 'controlled',
    }))

    expect(updateUrlState).toHaveBeenCalledWith({
      filters: expect.objectContaining({ accessManagement: ['open'] }),
      page: 0,
    })
  })
})
