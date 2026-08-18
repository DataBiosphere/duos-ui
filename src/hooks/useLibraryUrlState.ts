import { useSearchParams } from 'react-router'
import { useCallback, useMemo } from 'react'
import { AssetType, FilterState, LibraryUrlState, SortOrder } from 'src/types/library'

type ArrayFilterParamConfig = {
  key: keyof Pick<
    FilterState,
    | 'accessManagement'
    | 'dataUse'
    | 'dataUseModifiers'
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
    | 'soApprovalModel'
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
  { key: 'dataUseModifiers', param: 'dataUseModifiers' },
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
  { key: 'soApprovalModel', param: 'soApprovalModel' },
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

// Parse an integer URL param defensively: a malformed value (e.g. ?page=abc)
// must become undefined, not NaN — NaN serializes to null in the JSON query
// body and Elasticsearch rejects null range bounds / from / size, which would
// otherwise break every tab at once via the shared tab-counts query.
const parseIntParam = (value: string | null): number | undefined => {
  if (!value) {
    return undefined
  }
  const parsed = Number.parseInt(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

// Pagination params additionally fall back to their defaults when out of range
// (negative page, non-positive page size) so a hand-edited URL can't produce a
// negative `from` or an empty page slice.
const parsePageParam = (searchParams: URLSearchParams): number => {
  const page = parseIntParam(searchParams.get('page'))
  return page !== undefined && page > 0 ? page : 0
}

const parsePageSizeParam = (searchParams: URLSearchParams): number => {
  const pageSize = parseIntParam(searchParams.get('pageSize'))
  return pageSize !== undefined && pageSize > 0 ? pageSize : 25
}

const parseArrayParamValues = (searchParams: URLSearchParams, param: string): string[] => {
  const values = searchParams.getAll(param).map(value => value.trim()).filter(Boolean)

  if (values.length > 1) {
    return values
  }

  if (values.length === 1) {
    const [singleValue] = values

    // Backward compatibility for older URLs that stored arrays as CSV.
    // Preserve literal values that intentionally include comma + space.
    if (singleValue.includes(',') && !singleValue.includes(', ')) {
      return singleValue.split(',').map(value => value.trim()).filter(Boolean)
    }

    return [singleValue]
  }

  return []
}

const parseArrayFilters = (searchParams: URLSearchParams) => Object.fromEntries(
  ARRAY_FILTER_PARAM_CONFIG.map(({ key, param }) => [key, parseArrayParamValues(searchParams, param)]),
)

const parseRangeFilters = (searchParams: URLSearchParams) => Object.fromEntries(
  RANGE_FILTER_PARAM_CONFIG.map(({ key, minParam, maxParam, legacyMinParam, legacyMaxParam }) => {
    const minValue = searchParams.get(minParam) ?? (legacyMinParam ? searchParams.get(legacyMinParam) : null)
    const maxValue = searchParams.get(maxParam) ?? (legacyMaxParam ? searchParams.get(legacyMaxParam) : null)

    return [key, {
      min: parseIntParam(minValue),
      max: parseIntParam(maxValue),
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
    searchParams.delete(param)

    if (filters[key].length > 0) {
      filters[key].forEach(value => searchParams.append(param, value))
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

const parseBooleanParam = (searchParams: URLSearchParams, params: string[]): boolean | undefined => {
  for (const param of params) {
    const value = searchParams.get(param)
    if (value !== null) {
      return value === 'true'
    }
  }
  return undefined
}

const serializeBooleanFilterToUrl = (
  value: boolean | undefined,
  param: string,
  searchParams: URLSearchParams,
  legacyParams: string[] = [],
) => {
  legacyParams.forEach(legacyParam => searchParams.delete(legacyParam))

  if (value === undefined) {
    searchParams.delete(param)
  }
  else {
    searchParams.set(param, value ? 'true' : 'false')
  }
}

/**
 * Parse filters from URL search params
 */
const parseFiltersFromUrl = (searchParams: URLSearchParams): FilterState => {
  return {
    ...parseArrayFilters(searchParams),
    ...parseRangeFilters(searchParams),
    ...parseDateFilters(searchParams),
    datasetsCited: parseBooleanParam(searchParams, ['datasetsCited', 'presentationsDatasetsCited']),
    publicationsDatasetsCited: parseBooleanParam(searchParams, ['publicationsDatasetsCited']),
    instantApproval: parseBooleanParam(searchParams, ['instantApproval']),
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
  serializeBooleanFilterToUrl(filters.datasetsCited, 'datasetsCited', searchParams, ['presentationsDatasetsCited'])
  serializeBooleanFilterToUrl(filters.publicationsDatasetsCited, 'publicationsDatasetsCited', searchParams)
  serializeBooleanFilterToUrl(filters.instantApproval, 'instantApproval', searchParams)
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

  // react-router returns a stable `searchParams` reference per location, so
  // memoising on it keeps `state` (and, critically, `state.filters`) referentially
  // stable across unrelated re-renders. That preserves the React.memo on
  // LibraryFilters and the downstream useMemo/useCallback in useLibraryPageState,
  // which would otherwise recompute every render because a fresh filters object
  // was parsed each time.
  const state: LibraryUrlState = useMemo(() => ({
    library: searchParams.get('library') || 'duos',
    tab: (searchParams.get('tab') as AssetType) || AssetType.DATASETS,
    filters: parseFiltersFromUrl(searchParams),
    page: parsePageParam(searchParams),
    pageSize: parsePageSizeParam(searchParams),
    query: searchParams.get('query') || undefined,
    sortField: searchParams.get('sort') || undefined,
    sortOrder: (searchParams.get('order') as SortOrder) || undefined,
    hideFilters: searchParams.get('hideFilters') === 'true',
  }), [searchParams])

  const updateState = useCallback((updates: Partial<LibraryUrlState>) => {
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
  }, [searchParams, setSearchParams])

  return [state, updateState] as const
}
