import { useCallback, useMemo } from 'react'
import { useLibraryData, useLibraryMetadata } from 'src/hooks/useLibraryData'
import { useLibraryTabCounts } from 'src/hooks/useLibraryTabCounts'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { computeTabCounts, STUDY_ASSET_TABS } from 'src/hooks/libraryCounts'
import { ActiveFilterChip, AssetType, AvailableFilters, FilterState, LibraryVersionNew, SortOrder } from 'src/types/library'
import { assetRegistry } from 'src/components/data_library/assets'
import {
  EMPTY_FILTERS,
  getExternalActiveFilters,
  getFilterSectionsForAsset,
  removeFilterValue,
} from 'src/components/data_library/filterRegistry'
import { AggregationResult } from 'src/types/elastic'
import { BioSpecimenType, PostMortemIntervalUnit } from 'src/types/model'
import {
  clinicalTrialInterventionSelectOptions,
  clinicalTrialPhaseSelectOptions,
  clinicalTrialStatusSelectOptions,
} from 'src/utils/ClinicalTrialEnumUtils'
import { SecondaryDataUseTerms } from 'src/components/forms/SecondaryDataUseTerms'
import { getFormattedName } from 'src/components/forms/SelectOptionInterface'

/**
 * Panel wording for the secondary data use codes, keyed by the code the index stores.
 *
 * `SecondaryDataUseTerms` carries the vocabulary the dataset-submission and
 * consent-group forms are worded from, and `getFormattedName` supplies the app's
 * existing `Name (ABBR)` format — the abbreviation is what ties a checkbox to the
 * grid's data use chip, which shows codes only (`HMB-GSO-PUB`).
 *
 * That class covers only the eight restrictions those forms collect, so the codes
 * below fill in the rest of the secondary vocabulary the corpus can hold: the
 * modifiers `consentTranslations` translates for the dataset views, plus the
 * `AbstainDataUseCodes` the voting flow recognizes. Without them a real, selectable
 * checkbox would read as a bare abbreviation.
 *
 * `OTHER` is spelled out rather than taken from `SecondaryDataUseTerms.OTH`: the form's
 * key does not match what the index stores, and `OTH2` is a label this app synthesizes
 * at render time to tell a secondary other apart from a primary one (see
 * `processDataUseCodes`).
 */
const DATA_USE_MODIFIER_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    SecondaryDataUseTerms.VALUES
      .filter(term => term.key !== SecondaryDataUseTerms.OTH.key)
      .map(term => [term.key, getFormattedName(term)]),
  ),
  'OTHER': 'Other Secondary Restriction (OTH2)',
  'NCTRL': 'No Control Set Use (NCTRL)',
  'NAGR': 'No Aggregate-Level Data Use (NAGR)',
  'NCU': 'Non-Commercial Use Only (NCU)',
  'RS-G': 'Gender-Specific Research (RS-G)',
  'RS-PD': 'Pediatric Research Only (RS-PD)',
  'POP-M': 'Male-Specific Research (POP-M)',
  'POP-F': 'Female-Specific Research (POP-F)',
  'POP-PD': 'Pediatric Research Only (POP-PD)',
}

/**
 * A geographic restriction is the one modifier whose code is not fixed: dbGaP appends
 * the permitted region to it (`GS-US`), so the exact code cannot be enumerated above.
 * Match the family by prefix and keep the region visible — the alternative is the bare
 * code, and the region is the whole substance of the restriction.
 */
const dataUseModifierLabel = (code: string): string =>
  DATA_USE_MODIFIER_LABELS[code]
  ?? (code.startsWith('GS-') ? `Geographic Restriction (${code})` : code)

export function useLibraryPageState(libraryConfig: LibraryVersionNew, defaultTab?: AssetType) {
  const [urlState, updateUrlState] = useLibraryUrlState(defaultTab)

  const { data: metadata, isLoading: isMetadataLoading } = useLibraryMetadata(libraryConfig)

  const currentAsset = useMemo(() => assetRegistry[urlState.tab], [urlState.tab])

  // Every tab except Studies and Datasets renders from the identical shared
  // `studies` aggregation that the tab-counts query already fetches. Those
  // "study-asset" tabs therefore skip their own data query and derive their grid
  // from that single shared response — one full-corpus request per interaction
  // instead of two (the data query + the counts query returned the same corpus).
  const isStudyAssetTab = STUDY_ASSET_TABS.includes(urlState.tab)

  const {
    data: dataQueryResult,
    isFetching: isDataFetching,
    error: dataError,
  } = useLibraryData(
    libraryConfig,
    urlState.tab,
    urlState.filters,
    urlState.query ?? '',
    { page: urlState.page, pageSize: urlState.pageSize },
    urlState.sortField && urlState.sortOrder
      ? { field: urlState.sortField, order: urlState.sortOrder as SortOrder }
      : undefined,
    { enabled: !isStudyAssetTab },
  )

  // Tab counts come from a single dedicated query, independent of the active
  // tab, pagination and sort, so they are fetched once and reused as the user
  // pages, sorts, and switches tabs. Study-asset grids reuse its response too.
  const {
    data: tabCountsResponse,
    isFetching: isCountsFetching,
    error: countsError,
  } = useLibraryTabCounts(
    libraryConfig,
    urlState.filters,
    urlState.query ?? '',
  )

  // Badge counts are derived at render time from the shared response with the
  // *current* filters — the same inputs the study-asset grids are derived from
  // below — so a badge and its grid always agree, even while a refetch for new
  // filters is in flight and the response is still the previous placeholder.
  const tabCounts = useMemo(
    () => (tabCountsResponse ? computeTabCounts(tabCountsResponse, urlState.filters) : undefined),
    [tabCountsResponse, urlState.filters],
  )

  // Derive the study-asset grid page from the shared tab-counts response using
  // the asset's own transformResponse (which client-side paginates and filters),
  // so a tab's badge and its grid are computed from one identical request and
  // can never disagree. Pagination stays client-side, so paging needs no refetch.
  const derivedStudyAssetData = useMemo(() => {
    if (!isStudyAssetTab || !tabCountsResponse) {
      return undefined
    }
    return currentAsset.transformResponse(
      tabCountsResponse,
      { page: urlState.page, pageSize: urlState.pageSize },
      urlState.filters,
    )
  }, [isStudyAssetTab, tabCountsResponse, currentAsset, urlState.page, urlState.pageSize, urlState.filters])

  const data = isStudyAssetTab ? derivedStudyAssetData : dataQueryResult
  const isFetching = isStudyAssetTab ? isCountsFetching : isDataFetching
  const error = isStudyAssetTab ? countsError : dataError

  const availableFilters: AvailableFilters = useMemo(() => {
    const dacAgg = (metadata?.dac as AggregationResult)?.buckets || []
    const dataTypeAgg = (metadata?.data_type as AggregationResult)?.buckets || []

    // Options come from the codes the corpus actually contains, the way DAC and Data
    // Type do, so no checkbox can match nothing and no indexed code is unfilterable —
    // the app's three hand-maintained lists of secondary codes disagree with each
    // other, and only the index settles which spelling is real. Counts are deliberately
    // omitted; a code the label map has never heard of still lists, as its bare
    // abbreviation, rather than being dropped from a filter the corpus supports.
    const dataUseModifierAgg = (metadata?.data_use_modifiers as AggregationResult)?.buckets || []
    const dataUseModifierOptions = dataUseModifierAgg
      .map(bucket => bucket.key as string)
      .map(code => ({ value: code, label: dataUseModifierLabel(code) }))
      .sort((a, b) => a.label.localeCompare(b.label))
    const uniqueValues = (values: Array<string | undefined | null>) =>
      [...new Set(values.map(v => v?.trim()).filter(Boolean) as string[])]
        .sort((a, b) => a.localeCompare(b))
        .map(value => ({ value, label: value }))

    const workspaceItems = urlState.tab === AssetType.WORKSPACES
      ? data?.items as Array<{ tools?: string[], platform?: string }>
      : []
    const clinicalTrialItems = urlState.tab === AssetType.CLINICAL_TRIALS
      ? data?.items as Array<{ registry?: string }>
      : []
    const biospecimenItems = urlState.tab === AssetType.BIOSPECIMENS
      ? data?.items as Array<{ optionalDataUse?: string }>
      : []

    return {
      accessManagement: [
        { value: 'open', label: 'Open Access' },
        { value: 'controlled', label: 'via DUOS' },
        { value: 'external', label: 'External to DUOS' },
      ],
      dataUse: [
        { value: 'HMB', label: 'Health/Medical/Biomedical' },
        { value: 'GRU', label: 'General Research Use' },
        { value: 'DS', label: 'Disease Specific' },
        { value: 'OTHER', label: 'Other Restriction' },
        { value: 'NRES', label: 'No Restrictions' },
      ],
      dataUseModifiers: dataUseModifierOptions,
      dataType: dataTypeAgg
        .map(bucket => ({ value: bucket.key as string, label: bucket.key as string, count: bucket.doc_count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      dac: dacAgg
        .map(bucket => ({ value: bucket.key as string, label: bucket.key as string, count: bucket.doc_count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      workspaceTools: uniqueValues(workspaceItems.flatMap(item => item.tools || [])),
      workspacePlatform: uniqueValues(workspaceItems.map(item => item.platform)),
      clinicalTrialStatus: clinicalTrialStatusSelectOptions.map(o => ({ value: o.key, label: o.displayText })),
      clinicalTrialPhase: clinicalTrialPhaseSelectOptions.map(o => ({ value: o.key, label: o.displayText })),
      clinicalTrialInterventionType: clinicalTrialInterventionSelectOptions.map(o => ({ value: o.key, label: o.displayText })),
      clinicalTrialRegistry: uniqueValues(clinicalTrialItems.map(item => item.registry)),
      biospecimenType: Object.values(BioSpecimenType).map(value => ({ value, label: value })),
      biospecimenDataUse: uniqueValues(biospecimenItems.map(item => item.optionalDataUse)),
      biospecimenPostMortemIntervalUnit: Object.values(PostMortemIntervalUnit).map(value => ({ value, label: value })),
      soApprovalModel: [
        { value: 'PER_REQUEST', label: 'Per-Request Approval' },
        { value: 'PRE_AUTHORIZED', label: 'Pre-Authorized Researchers' },
      ],
      datasetsCited: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      publicationsDatasetsCited: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      instantApproval: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      biospecimenPostMortemIntervalRange: { min: 0, max: 1000000 },
      participantCountRange: { min: 0, max: 100000 },
    }
  }, [metadata, data?.items, urlState.tab])

  const filterSections = useMemo(
    () => getFilterSectionsForAsset(urlState.tab, availableFilters),
    [urlState.tab, availableFilters],
  )

  // Filters set on other tabs are kept in state so they persist across tab
  // switches; surface them here so the panel can show them as removable chips.
  const externalFilters = useMemo(
    () => getExternalActiveFilters(urlState.tab, urlState.filters, availableFilters),
    [urlState.tab, urlState.filters, availableFilters],
  )

  const sortModel = useMemo(() => {
    if (urlState.sortField && urlState.sortOrder) {
      return [{ field: urlState.sortField, sort: urlState.sortOrder }]
    }
    return []
  }, [urlState.sortField, urlState.sortOrder])

  // Keep the full filter set when switching tabs so filters applied on one tab
  // remain active (and visible) on the others. The sort is cleared because sort
  // fields are tab-specific: carrying e.g. a Publications `title` sort onto the
  // Datasets tab would send Elasticsearch a sort on an unmapped field and fail
  // the whole query.
  const handleTabChange = useCallback((newAssetType: AssetType) => {
    updateUrlState({ tab: newAssetType, page: 0, sortField: undefined, sortOrder: undefined })
  }, [updateUrlState])

  const handleSearchChange = useCallback((query: string) => {
    updateUrlState({ query, page: 0 })
  }, [updateUrlState])

  // Any filter change resets to the first page: the current page index can
  // exceed the narrowed result set, which would render an empty grid while the
  // count badge still shows matches.
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    updateUrlState({ filters: newFilters, page: 0 })
  }, [updateUrlState])

  const handleClearFilters = useCallback(() => {
    updateUrlState({ filters: EMPTY_FILTERS, page: 0 })
  }, [updateUrlState])

  // Remove a filter carried over from another tab without switching to it.
  const handleRemoveExternalFilter = useCallback((chip: ActiveFilterChip) => {
    updateUrlState({ filters: removeFilterValue(urlState.filters, chip.key, chip.value), page: 0 })
  }, [updateUrlState, urlState.filters])

  const handleSortChange = useCallback((model: Array<{ field: string, sort: SortOrder | null }>) => {
    if (model.length > 0 && model[0].sort) {
      updateUrlState({ sortField: model[0].field, sortOrder: model[0].sort })
    }
    else {
      updateUrlState({ sortField: undefined, sortOrder: undefined })
    }
  }, [updateUrlState])

  const handleToggleFilters = useCallback(() => {
    updateUrlState({ hideFilters: !urlState.hideFilters })
  }, [updateUrlState, urlState.hideFilters])

  return {
    urlState,
    updateUrlState,
    data,
    isFetching,
    error,
    isMetadataLoading,
    availableFilters,
    tabCounts,
    currentAsset,
    filterSections,
    externalFilters,
    sortModel,
    handleTabChange,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    handleRemoveExternalFilter,
    handleSortChange,
    handleToggleFilters,
  }
}

export type LibraryPageState = ReturnType<typeof useLibraryPageState>
