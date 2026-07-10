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

const tabCountsData = { [AssetType.STUDIES]: 3, [AssetType.MODELS]: 4 }

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
    data: { counts: tabCountsData, response: { aggregations: { studies: { buckets: [] } } } },
    isFetching: false,
    error: null,
  } as unknown as ReturnType<typeof useLibraryTabCounts>)
})

describe('useLibraryPageState — tab-count wiring', () => {
  it('reads tab counts from the dedicated counts query on a study-asset tab', () => {
    setup(AssetType.MODELS)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.tabCounts).toEqual(tabCountsData)
    // The counts query is keyed only on (libraryConfig, filters, queryTerm) — no
    // active tab, pagination or sort — so it is shared across tabs.
    expect(vi.mocked(useLibraryTabCounts).mock.calls.at(-1)).toEqual([libraryConfig, EMPTY_FILTERS, ''])
  })

  it('reads tab counts from the same dedicated query on the Studies tab', () => {
    setup(AssetType.STUDIES)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.tabCounts).toEqual(tabCountsData)
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
    vi.mocked(useLibraryTabCounts).mockReturnValue({
      data: {
        counts: tabCountsData,
        response: {
          aggregations: {
            studies: {
              buckets: [
                {
                  key: 1,
                  study_details: {
                    hits: { hits: [{ _source: { study: { studyId: 1, studyName: 'S1', assets: { models: [{ name: 'M1' }] } } } }] },
                  },
                },
              ],
            },
          },
        },
      },
      isFetching: false,
      error: null,
    } as unknown as ReturnType<typeof useLibraryTabCounts>)

    const { result } = renderHook(() => useLibraryPageState(libraryConfig))
    // modelAsset.transformResponse flattens the one nested model from the shared
    // counts response — no separate data query needed.
    expect(result.current.data?.items).toHaveLength(1)
  })
})

describe('useLibraryPageState — filter handlers', () => {
  it('keeps the full filter set when switching tabs (filters combine across tabs)', () => {
    setup(AssetType.MODELS, { ...EMPTY_FILTERS, accessManagement: ['controlled'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    act(() => result.current.handleTabChange(AssetType.PUBLICATIONS))

    // No filters key means the existing filters are left untouched.
    expect(updateUrlState).toHaveBeenCalledWith({ tab: AssetType.PUBLICATIONS, page: 0 })
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
    })
  })
})
