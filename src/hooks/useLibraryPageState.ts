import { useCallback, useMemo } from 'react'
import { useLibraryData, useLibraryMetadata } from 'src/hooks/useLibraryData'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { AssetType, AvailableFilters, FilterState, LibraryVersionNew, SortOrder } from 'src/types/library'
import { assetRegistry } from 'src/components/data_library/assets'
import {
  EMPTY_FILTERS,
  getFilterSectionsForAsset,
  sanitizeFiltersForAsset,
} from 'src/components/data_library/filterRegistry'
import { AggregationResult } from 'src/types/elastic'
import { BioSpecimenType, PostMortemIntervalUnit } from 'src/types/model'
import {
  clinicalTrialInterventionSelectOptions,
  clinicalTrialPhaseSelectOptions,
  clinicalTrialStatusSelectOptions,
} from 'src/utils/ClinicalTrialEnumUtils'

export function useLibraryPageState(libraryConfig: LibraryVersionNew) {
  const [urlState, updateUrlState] = useLibraryUrlState()

  const { data: metadata, isLoading: isMetadataLoading } = useLibraryMetadata(libraryConfig)

  const { data, isFetching, error } = useLibraryData(
    libraryConfig,
    urlState.tab,
    urlState.filters,
    urlState.query ?? '',
    { page: urlState.page, pageSize: urlState.pageSize },
    urlState.sortField && urlState.sortOrder
      ? { field: urlState.sortField, order: urlState.sortOrder as SortOrder }
      : undefined,
  )

  const availableFilters: AvailableFilters = useMemo(() => {
    const dacAgg = (metadata?.dac as AggregationResult)?.buckets || []
    const dataTypeAgg = (metadata?.data_type as AggregationResult)?.buckets || []

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
      datasetsCited: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      biospecimenPostMortemIntervalRange: { min: 0, max: 1000000 },
      participantCountRange: { min: 0, max: 100000 },
    }
  }, [metadata, data?.items, urlState.tab])

  const currentAsset = useMemo(() => assetRegistry[urlState.tab], [urlState.tab])

  const sanitizedFilters = useMemo(
    () => sanitizeFiltersForAsset(urlState.tab, urlState.filters),
    [urlState.tab, urlState.filters],
  )

  const filterSections = useMemo(
    () => getFilterSectionsForAsset(urlState.tab, availableFilters),
    [urlState.tab, availableFilters],
  )

  const sortModel = useMemo(() => {
    if (urlState.sortField && urlState.sortOrder) {
      return [{ field: urlState.sortField, sort: urlState.sortOrder }]
    }
    return []
  }, [urlState.sortField, urlState.sortOrder])

  const handleTabChange = useCallback((newAssetType: AssetType) => {
    updateUrlState({
      tab: newAssetType,
      page: 0,
      filters: sanitizeFiltersForAsset(newAssetType, urlState.filters),
    })
  }, [updateUrlState, urlState.filters])

  const handleSearchChange = useCallback((query: string) => {
    updateUrlState({ query, page: 0 })
  }, [updateUrlState])

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    updateUrlState({ filters: sanitizeFiltersForAsset(urlState.tab, newFilters) })
  }, [updateUrlState, urlState.tab])

  const handleClearFilters = useCallback(() => {
    updateUrlState({ filters: sanitizeFiltersForAsset(urlState.tab, EMPTY_FILTERS), page: 0 })
  }, [updateUrlState, urlState.tab])

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
    currentAsset,
    sanitizedFilters,
    filterSections,
    sortModel,
    handleTabChange,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    handleSortChange,
    handleToggleFilters,
  }
}

export type LibraryPageState = ReturnType<typeof useLibraryPageState>
