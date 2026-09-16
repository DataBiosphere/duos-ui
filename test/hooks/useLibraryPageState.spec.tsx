import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLibraryPageState } from 'src/hooks/useLibraryPageState'
import { AssetType, FilterState, LibraryVersionNew } from 'src/types/library'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { useLibraryData, useLibraryMetadata } from 'src/hooks/useLibraryData'
import { useLibraryTabCounts, useOptionCorpus } from 'src/hooks/useLibraryTabCounts'
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

// Both observers answer from one function of the filters. Cleared, not just
// re-stubbed, because tests read `mock.calls`.
const mockCorpus = (
  responseFor: (filters: FilterState) => unknown,
  isPlaceholderFor: (filters: FilterState) => boolean = () => false,
) => {
  vi.mocked(useLibraryTabCounts).mockClear()
  vi.mocked(useOptionCorpus).mockClear()
  vi.mocked(useLibraryTabCounts).mockImplementation((_config, filters: FilterState) => ({
    data: responseFor(filters),
    isFetching: false,
    isPlaceholderData: isPlaceholderFor(filters),
    error: null,
  } as unknown as ReturnType<typeof useLibraryTabCounts>))
  vi.mocked(useOptionCorpus).mockImplementation((_config, filters: FilterState, _term, enabled) => ({
    data: enabled ? responseFor(filters) : undefined,
    isFetching: false,
    isPlaceholderData: enabled && isPlaceholderFor(filters),
    error: null,
  } as unknown as ReturnType<typeof useOptionCorpus>))
}

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
  mockCorpus(() => tabCountsResponse)
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

describe('useLibraryPageState — data use modifier options', () => {
  const withModifierFacet = (codes: string[]) => {
    vi.mocked(useLibraryMetadata).mockReturnValue({
      data: { data_use_modifiers: { buckets: codes.map(key => ({ key, doc_count: 3 })) } },
      isLoading: false,
    } as unknown as ReturnType<typeof useLibraryMetadata>)
    setup(AssetType.DATASETS)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))
    return result.current.availableFilters.dataUseModifiers
  }

  it('offers exactly the codes the index reports, so no checkbox matches nothing', () => {
    const options = withModifierFacet(['NPU', 'IRB', 'MOR'])
    expect(options.map(option => option.value).sort()).toEqual(['IRB', 'MOR', 'NPU'])
  })

  it('words each restriction the way the submission forms do, with its abbreviation', () => {
    const options = withModifierFacet(['IRB', 'MOR', 'GS', 'NPU'])
    expect(options).toContainEqual({ value: 'IRB', label: 'Ethics Approval Required (IRB)' })
    expect(options).toContainEqual({ value: 'MOR', label: 'Publication Moratorium (MOR)' })
    expect(options).toContainEqual({ value: 'GS', label: 'Geographic Restriction (GS)' })
    expect(options).toContainEqual({ value: 'NPU', label: 'Non-profit Use Only (NPU)' })
  })

  it('labels a secondary other-restriction OTH2 while still querying the indexed OTHER', () => {
    const options = withModifierFacet(['OTHER'])
    expect(options).toEqual([{ value: 'OTHER', label: 'Other Secondary Restriction (OTH2)' }])
  })

  it('words the modifiers the submission forms do not collect', () => {
    // These live in `consentTranslations` and `AbstainDataUseCodes` rather than in
    // SecondaryDataUseTerms, and are as real as any code the forms do collect.
    const options = withModifierFacet(['NCTRL', 'NAGR', 'NCU', 'RS-G', 'RS-PD', 'POP-M', 'POP-F', 'POP-PD'])
    expect(options).toContainEqual({ value: 'NCTRL', label: 'No Control Set Use (NCTRL)' })
    expect(options).toContainEqual({ value: 'NAGR', label: 'No Aggregate-Level Data Use (NAGR)' })
    expect(options).toContainEqual({ value: 'NCU', label: 'Non-Commercial Use Only (NCU)' })
    expect(options).toContainEqual({ value: 'RS-G', label: 'Gender-Specific Research (RS-G)' })
    expect(options).toContainEqual({ value: 'RS-PD', label: 'Pediatric Research Only (RS-PD)' })
    expect(options).toContainEqual({ value: 'POP-M', label: 'Male-Specific Research (POP-M)' })
    expect(options).toContainEqual({ value: 'POP-F', label: 'Female-Specific Research (POP-F)' })
    expect(options).toContainEqual({ value: 'POP-PD', label: 'Pediatric Research Only (POP-PD)' })
  })

  it('reads a region-qualified geographic restriction, and the legacy bare GS-', () => {
    // dbGaP appends the permitted region to the code, so `GS-US` cannot be enumerated;
    // `GS-` is what datasets indexed under the app's older spelling still carry.
    const options = withModifierFacet(['GS-US', 'GS-'])
    expect(options).toContainEqual({ value: 'GS-US', label: 'Geographic Restriction (GS-US)' })
    expect(options).toContainEqual({ value: 'GS-', label: 'Geographic Restriction (GS-)' })
  })

  it('keeps a code with no label, showing its bare abbreviation', () => {
    // An unrecognized code must stay filterable rather than vanish from a filter the
    // corpus supports — the index, not this app's code lists, decides what exists.
    const options = withModifierFacet(['XYZ', 'NPU'])
    expect(options).toContainEqual({ value: 'XYZ', label: 'XYZ' })
  })

  it('lists options alphabetically by label', () => {
    const labels = withModifierFacet(['PUB', 'COL', 'IRB', 'OTHER', 'ZZZ']).map(option => option.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)))
  })

  it('carries no facet counts', () => {
    expect(withModifierFacet(['NPU', 'IRB']).every(option => option.count === undefined)).toBe(true)
  })

  it('offers nothing when the aggregation is absent, rather than throwing', () => {
    setup(AssetType.DATASETS)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))
    expect(result.current.availableFilters.dataUseModifiers).toEqual([])
  })
})

describe('useLibraryPageState — full-corpus filter options', () => {
  // Two workspaces in one study, so options can be derived off-tab.
  const bucket = {
    key: 1,
    study_details: {
      hits: {
        hits: [{
          _source: {
            study: {
              studyId: 1,
              studyName: 'Study 1',
              assets: {
                workspaces: [
                  { workspaceId: 'w1', tools: ['Jupyter'], platform: 'Terra' },
                  { workspaceId: 'w2', tools: ['WDL'], platform: 'AnVIL' },
                ],
              },
            },
          },
        }],
      },
    },
  }

  const responseWithBucket = {
    aggregations: {
      total_studies: { value: 1 },
      datasets_count: { doc_count: 0 },
      studies: { buckets: [bucket] },
    },
  }

  beforeEach(() => {
    mockCorpus(() => responseWithBucket)
  })

  // These used to read `data.items`, so they emptied when the user left the tab.
  it('populates an option list even while a different tab is active', () => {
    setup(AssetType.STUDIES)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL', 'Terra'])
    expect(result.current.availableFilters.workspaceTools.map(o => o.value)).toEqual(['Jupyter', 'WDL'])
  })

  it('derives options from the full corpus, not just the current page', () => {
    vi.mocked(useLibraryUrlState).mockReturnValue([
      { library: 'duos', tab: AssetType.WORKSPACES, filters: EMPTY_FILTERS, query: '', page: 0, pageSize: 1, hideFilters: false },
      updateUrlState,
    ] as unknown as ReturnType<typeof useLibraryUrlState>)
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    // The grid renders one workspace; both platforms are still offered.
    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL', 'Terra'])
  })

  // Otherwise a multi-select checkbox group can never hold more than one value.
  it('keeps every value selectable once one of them is checked', () => {
    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL', 'Terra'])
    // The grid still honours the filter; only the option list ignores it.
    expect(result.current.data?.items).toHaveLength(1)
  })

  it('clears the whole asset\'s filters when deriving its options, so sibling lists stay complete', () => {
    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.availableFilters.workspaceTools.map(o => o.value)).toEqual(['Jupyter', 'WDL'])
  })

  // No client-side pass can recover a study the response never carried.
  it('offers a value whose only study the active filter removes from the response', () => {
    const oneWorkspaceStudy = (studyId: number, platform: string) => ({
      key: studyId,
      study_details: {
        hits: { hits: [{ _source: { study: { studyId, studyName: `Study ${studyId}`, assets: { workspaces: [{ workspaceId: `w${studyId}`, platform }] } } } }] },
      },
    })
    const allStudies = [oneWorkspaceStudy(1, 'Terra'), oneWorkspaceStudy(2, 'AnVIL')]

    mockCorpus((filters) => {
      const selected = filters.workspacePlatform
      const buckets = selected.length > 0
        ? allStudies.filter(b => selected.includes(b.study_details.hits.hits[0]._source.study.assets.workspaces[0].platform))
        : allStudies
      return { aggregations: { total_studies: { value: buckets.length }, datasets_count: { doc_count: 0 }, studies: { buckets } } }
    })

    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL', 'Terra'])
    // The grid still shows only the matching study's workspace.
    expect(result.current.data?.items).toHaveLength(1)
  })

  // Other tabs' filters still scope the corpus, so options match the grid.
  it('keeps filters owned by other tabs applied when deriving an asset\'s options', () => {
    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'], accessManagement: ['controlled'] })
    renderHook(() => useLibraryPageState(libraryConfig))

    // Counts keeps every filter; the corpus clears only the Workspaces keys.
    expect(vi.mocked(useLibraryTabCounts).mock.calls.at(-1)?.[1])
      .toEqual(expect.objectContaining({ workspacePlatform: ['Terra'], accessManagement: ['controlled'] }))
    expect(vi.mocked(useOptionCorpus).mock.calls.at(-1)?.[1])
      .toEqual(expect.objectContaining({ workspacePlatform: [], accessManagement: ['controlled'] }))
  })

  // The excluding filter is another tab's, so it scopes the corpus too and
  // self-exclusion cannot bring the value back.
  it('keeps a selected value listed when another tab\'s filter excludes every study carrying it', () => {
    const anvilOnly = {
      key: 2,
      study_details: {
        hits: { hits: [{ _source: { study: { studyId: 2, studyName: 'Study 2', assets: { workspaces: [{ workspaceId: 'w2', platform: 'AnVIL' }] } } } }] },
      },
    }

    // Any response scoped by accessManagement drops the Terra study entirely.
    mockCorpus(filters => ({
      aggregations: {
        total_studies: { value: 1 },
        datasets_count: { doc_count: 0 },
        studies: { buckets: filters.accessManagement.length > 0 ? [anvilOnly] : [bucket] },
      },
    }))

    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'], accessManagement: ['controlled'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    // The derived corpus offers only AnVIL...
    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL'])
    // ...but the panel still lists Terra, so it can be unchecked.
    const platform = result.current.filterSections.find(section => section.key === 'workspacePlatform')
    expect(platform?.options?.map(o => o.value)).toEqual(['AnVIL', 'Terra'])
  })

  // A static-enum tab reads no corpus, so the extra request would be wasted.
  it('mounts no second aggregation for a tab with no corpus-derived options', () => {
    setup(AssetType.PRESENTATIONS, { ...EMPTY_FILTERS, datasetsCited: true })
    renderHook(() => useLibraryPageState(libraryConfig))

    expect(vi.mocked(useOptionCorpus).mock.calls.at(-1)?.[3]).toBe(false)
  })

  it('still mounts the cleared-keys aggregation for a corpus-derived tab', () => {
    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'] })
    renderHook(() => useLibraryPageState(libraryConfig))

    expect(vi.mocked(useOptionCorpus).mock.calls.at(-1)?.[3]).toBe(true)
  })

  // Placeholder data is still scoped by the previous tab's cleared keys.
  it('ignores a stale corpus and falls back to the counts response', () => {
    const anvilOnly = {
      key: 2,
      study_details: {
        hits: { hits: [{ _source: { study: { studyId: 2, studyName: 'Study 2', assets: { workspaces: [{ workspaceId: 'w2', platform: 'AnVIL' }] } } } }] },
      },
    }

    // The stale corpus holds both platforms; the live counts response holds AnVIL.
    mockCorpus(
      filters => (filters.workspacePlatform.length === 0
        ? responseWithBucket
        : { aggregations: { total_studies: { value: 1 }, datasets_count: { doc_count: 0 }, studies: { buckets: [anvilOnly] } } }),
      filters => filters.workspacePlatform.length === 0,
    )
    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['AnVIL'] })
    const { result } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL'])
  })

  // Until the corpus lands, options fall back to the narrower counts response:
  // briefly short rather than blank.
  it('falls back to the counts response until the cleared-set corpus arrives', () => {
    const terraOnly = {
      key: 1,
      study_details: {
        hits: { hits: [{ _source: { study: { studyId: 1, studyName: 'Study 1', assets: { workspaces: [{ workspaceId: 'w1', platform: 'Terra' }] } } } }] },
      },
    }
    mockCorpus(filters => (filters.workspacePlatform.length === 0
      ? undefined
      : { aggregations: { total_studies: { value: 1 }, datasets_count: { doc_count: 0 }, studies: { buckets: [terraOnly] } } }))
    setup(AssetType.WORKSPACES, { ...EMPTY_FILTERS, workspacePlatform: ['Terra'] })
    const { result, rerender } = renderHook(() => useLibraryPageState(libraryConfig))

    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['Terra'])

    mockCorpus(() => responseWithBucket)
    rerender()

    expect(result.current.availableFilters.workspacePlatform.map(o => o.value)).toEqual(['AnVIL', 'Terra'])
  })
})
