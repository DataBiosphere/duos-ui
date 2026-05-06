import { useSearchParams } from 'react-router-dom'
import { AssetType, FilterState, LibraryUrlState, SortOrder } from 'src/types/library'

type ArrayFilterParamConfig = {
  key: keyof Pick<
    FilterState,
    | 'accessManagement'
    | 'dataUse'
    | 'dataType'
    | 'dac'
    | 'workspaceTools'
    | 'workspacePlatform'
    | 'clinicalTrialStatus'
    | 'clinicalTrialPhase'
    | 'clinicalTrialInterventionType'
    | 'clinicalTrialRegistry'
    | 'biospecimenType'
    | 'biospecimenDataUse'
    | 'biospecimenPostMortemIntervalUnit'
  >
  param: string
}

type RangeFilterParamConfig = {
  key: keyof Pick<FilterState, 'participantCount' | 'biospecimenPostMortemInterval'>
  minParam: string
  maxParam: string
  legacyMinParam?: string
  legacyMaxParam?: string
}

type DateFilterParamConfig = {
  key: keyof Pick<FilterState, 'clinicalTrialDates' | 'biospecimenCollectionDate' | 'ipFiledDate' | 'fundingDate'>
  startParam: string
  endParam: string
  startKey?: string
  endKey?: string
}

const ARRAY_FILTER_PARAM_CONFIG: ArrayFilterParamConfig[] = [
  { key: 'accessManagement', param: 'access' },
  { key: 'dataUse', param: 'dataUse' },
  { key: 'dataType', param: 'dataType' },
  { key: 'dac', param: 'dac' },
  { key: 'workspaceTools', param: 'workspaceTools' },
  { key: 'workspacePlatform', param: 'workspacePlatform' },
  { key: 'clinicalTrialStatus', param: 'clinicalTrialStatus' },
  { key: 'clinicalTrialPhase', param: 'clinicalTrialPhase' },
  { key: 'clinicalTrialInterventionType', param: 'clinicalTrialInterventionType' },
  { key: 'clinicalTrialRegistry', param: 'clinicalTrialRegistry' },
  { key: 'biospecimenType', param: 'biospecimenType' },
  { key: 'biospecimenDataUse', param: 'biospecimenDataUse' },
  { key: 'biospecimenPostMortemIntervalUnit', param: 'biospecimenPostMortemIntervalUnit' },
]

const RANGE_FILTER_PARAM_CONFIG: RangeFilterParamConfig[] = [
  { key: 'participantCount', minParam: 'minParticipants', maxParam: 'maxParticipants' },
  {
    key: 'biospecimenPostMortemInterval',
    minParam: 'biospecimenPostMortemIntervalMin',
    maxParam: 'biospecimenPostMortemIntervalMax',
    legacyMinParam: 'biospecimenSampleAmountMin',
    legacyMaxParam: 'biospecimenSampleAmountMax',
  },
]

const DATE_FILTER_PARAM_CONFIG: DateFilterParamConfig[] = [
  { key: 'clinicalTrialDates', startParam: 'clinicalTrialStartDate', endParam: 'clinicalTrialEndDate' },
  { key: 'biospecimenCollectionDate', startParam: 'biospecimenCollectedAfter', endParam: 'biospecimenCollectedBefore', startKey: 'after', endKey: 'before' },
  { key: 'ipFiledDate', startParam: 'ipFiledAfter', endParam: 'ipFiledBefore', startKey: 'after', endKey: 'before' },
  { key: 'fundingDate', startParam: 'fundingStartDate', endParam: 'fundingEndDate' },
]

const parseArrayFilters = (searchParams: URLSearchParams) => Object.fromEntries(
  ARRAY_FILTER_PARAM_CONFIG.map(({ key, param }) => [key, searchParams.get(param)?.split(',').filter(Boolean) || []]),
)

const parseRangeFilters = (searchParams: URLSearchParams) => Object.fromEntries(
  RANGE_FILTER_PARAM_CONFIG.map(({ key, minParam, maxParam, legacyMinParam, legacyMaxParam }) => {
    const minValue = searchParams.get(minParam) ?? (legacyMinParam ? searchParams.get(legacyMinParam) : null)
    const maxValue = searchParams.get(maxParam) ?? (legacyMaxParam ? searchParams.get(legacyMaxParam) : null)

    return [key, {
      min: minValue ? Number.parseInt(minValue) : undefined,
      max: maxValue ? Number.parseInt(maxValue) : undefined,
    }]
  }),
)

const parseDateFilters = (searchParams: URLSearchParams) => Object.fromEntries(
  DATE_FILTER_PARAM_CONFIG.map(({ key, startParam, endParam, startKey = 'startDate', endKey = 'endDate' }) => [
    key,
    {
      [startKey]: searchParams.get(startParam) || undefined,
      [endKey]: searchParams.get(endParam) || undefined,
    },
  ]),
)

const serializeArrayFiltersToUrl = (filters: FilterState, searchParams: URLSearchParams) => {
  ARRAY_FILTER_PARAM_CONFIG.forEach(({ key, param }) => {
    if (filters[key].length > 0) {
      searchParams.set(param, filters[key].join(','))
    }
    else {
      searchParams.delete(param)
    }
  })
}

const serializeRangeFiltersToUrl = (filters: FilterState, searchParams: URLSearchParams) => {
  RANGE_FILTER_PARAM_CONFIG.forEach(({ key, minParam, maxParam, legacyMinParam, legacyMaxParam }) => {
    const range = filters[key]
    if (range.min === undefined) {
      searchParams.delete(minParam)
      if (legacyMinParam) {
        searchParams.delete(legacyMinParam)
      }
    }
    else {
      searchParams.set(minParam, range.min.toString())
      if (legacyMinParam) {
        searchParams.delete(legacyMinParam)
      }
    }

    if (range.max === undefined) {
      searchParams.delete(maxParam)
      if (legacyMaxParam) {
        searchParams.delete(legacyMaxParam)
      }
    }
    else {
      searchParams.set(maxParam, range.max.toString())
      if (legacyMaxParam) {
        searchParams.delete(legacyMaxParam)
      }
    }
  })
}

const serializeDateFiltersToUrl = (filters: FilterState, searchParams: URLSearchParams) => {
  DATE_FILTER_PARAM_CONFIG.forEach(({ key, startParam, endParam, startKey = 'startDate', endKey = 'endDate' }) => {
    const value = filters[key] as Record<string, string | undefined>
    const startValue = value[startKey]
    const endValue = value[endKey]

    if (startValue) {
      searchParams.set(startParam, startValue)
    }
    else {
      searchParams.delete(startParam)
    }

    if (endValue) {
      searchParams.set(endParam, endValue)
    }
    else {
      searchParams.delete(endParam)
    }
  })
}

const parseDatasetsCited = (searchParams: URLSearchParams) => {
  const value = searchParams.get('datasetsCited')
    ?? searchParams.get('presentationsDatasetsCited')
    ?? searchParams.get('publicationsDatasetsCited')

  return value === null ? undefined : value === 'true'
}

const serializeDatasetsCitedToUrl = (filters: FilterState, searchParams: URLSearchParams) => {
  if (filters.datasetsCited === undefined) {
    searchParams.delete('datasetsCited')
    searchParams.delete('presentationsDatasetsCited')
    searchParams.delete('publicationsDatasetsCited')
    return
  }

  searchParams.set('datasetsCited', filters.datasetsCited ? 'true' : 'false')
  searchParams.delete('presentationsDatasetsCited')
  searchParams.delete('publicationsDatasetsCited')
}

/**
 * Parse filters from URL search params
 */
const parseFiltersFromUrl = (searchParams: URLSearchParams): FilterState => {
  return {
    ...parseArrayFilters(searchParams),
    ...parseRangeFilters(searchParams),
    ...parseDateFilters(searchParams),
    datasetsCited: parseDatasetsCited(searchParams),
  } as FilterState
}

/**
 * Serialize filters to URL search params
 */
const serializeFiltersToUrl = (
  filters: FilterState,
  searchParams: URLSearchParams,
): void => {
  serializeArrayFiltersToUrl(filters, searchParams)
  serializeDatasetsCitedToUrl(filters, searchParams)
  serializeRangeFiltersToUrl(filters, searchParams)
  serializeDateFiltersToUrl(filters, searchParams)
}

const setOrDeleteParam = (searchParams: URLSearchParams, key: string, value?: string) => {
  if (value) {
    searchParams.set(key, value)
  }
  else {
    searchParams.delete(key)
  }
}

const hasOwnUpdate = <K extends keyof LibraryUrlState>(updates: Partial<LibraryUrlState>, key: K) => (
  Object.hasOwn(updates, key)
)

const applyStringStateUpdate = (
  updates: Partial<LibraryUrlState>,
  searchParams: URLSearchParams,
  updateKey: keyof Pick<LibraryUrlState, 'library' | 'tab' | 'query'>,
  param: string,
) => {
  const value = updates[updateKey]
  if (value !== undefined) {
    setOrDeleteParam(searchParams, param, value)
  }
}

const applyPageUpdate = (updates: Partial<LibraryUrlState>, searchParams: URLSearchParams) => {
  if (updates.page === undefined) {
    return
  }

  if (updates.page > 0) {
    searchParams.set('page', updates.page.toString())
  }
  else {
    searchParams.delete('page')
  }
}

const applyPageSizeUpdate = (updates: Partial<LibraryUrlState>, searchParams: URLSearchParams) => {
  if (updates.pageSize === undefined) {
    return
  }

  if (updates.pageSize === 25) {
    searchParams.delete('pageSize')
  }
  else {
    searchParams.set('pageSize', updates.pageSize.toString())
  }
}

const applySortFieldUpdate = (updates: Partial<LibraryUrlState>, searchParams: URLSearchParams) => {
  if (hasOwnUpdate(updates, 'sortField')) {
    setOrDeleteParam(searchParams, 'sort', updates.sortField)
  }
}

const applySortOrderUpdate = (updates: Partial<LibraryUrlState>, searchParams: URLSearchParams) => {
  if (hasOwnUpdate(updates, 'sortOrder')) {
    setOrDeleteParam(searchParams, 'order', updates.sortOrder)
  }
}

const applyHideFiltersUpdate = (updates: Partial<LibraryUrlState>, searchParams: URLSearchParams) => {
  if (hasOwnUpdate(updates, 'hideFilters')) {
    if (updates.hideFilters) {
      searchParams.set('hideFilters', 'true')
    }
    else {
      searchParams.delete('hideFilters')
    }
  }
}

/**
 * Custom hook to manage library state in URL search params
 * @returns [state, updateState] tuple
 */
export const useLibraryUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const state: LibraryUrlState = {
    library: searchParams.get('library') || 'duos',
    tab: (searchParams.get('tab') as AssetType) || AssetType.DATASETS,
    filters: parseFiltersFromUrl(searchParams),
    page: Number.parseInt(searchParams.get('page') || '0'),
    pageSize: Number.parseInt(searchParams.get('pageSize') || '25'),
    query: searchParams.get('query') || undefined,
    sortField: searchParams.get('sort') || undefined,
    sortOrder: (searchParams.get('order') as SortOrder) || undefined,
    hideFilters: searchParams.get('hideFilters') === 'true',
  }

  const updateState = (updates: Partial<LibraryUrlState>) => {
    const newParams = new URLSearchParams(searchParams)

    applyStringStateUpdate(updates, newParams, 'library', 'library')
    applyStringStateUpdate(updates, newParams, 'tab', 'tab')
    applyPageUpdate(updates, newParams)
    applyPageSizeUpdate(updates, newParams)
    applyStringStateUpdate(updates, newParams, 'query', 'query')
    applySortFieldUpdate(updates, newParams)
    applySortOrderUpdate(updates, newParams)
    applyHideFiltersUpdate(updates, newParams)

    if (updates.filters !== undefined) {
      serializeFiltersToUrl(updates.filters, newParams)
    }

    setSearchParams(newParams)
  }

  return [state, updateState] as const
}
