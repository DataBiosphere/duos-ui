import { useSearchParams } from 'react-router-dom'
import { AssetType, FilterState, LibraryUrlState, SortOrder } from 'src/types/library'

/**
 * Parse filters from URL search params
 */
const parseFiltersFromUrl = (searchParams: URLSearchParams): FilterState => {
  const filters: FilterState = {
    accessManagement: searchParams.get('access')?.split(',').filter(Boolean) || [],
    dataUse: searchParams.get('dataUse')?.split(',').filter(Boolean) || [],
    dataType: searchParams.get('dataType')?.split(',').filter(Boolean) || [],
    dac: searchParams.get('dac')?.split(',').filter(Boolean) || [],
    participantCount: {
      min: searchParams.get('minParticipants')
        ? Number.parseInt(searchParams.get('minParticipants')!)
        : undefined,
      max: searchParams.get('maxParticipants')
        ? Number.parseInt(searchParams.get('maxParticipants')!)
        : undefined,
    },
  }
  return filters
}

/**
 * Serialize filters to URL search params
 */
const serializeFiltersToUrl = (
  filters: FilterState,
  searchParams: URLSearchParams,
): void => {
  if (filters.accessManagement.length > 0) {
    searchParams.set('access', filters.accessManagement.join(','))
  }
  else {
    searchParams.delete('access')
  }

  if (filters.dataUse.length > 0) {
    searchParams.set('dataUse', filters.dataUse.join(','))
  }
  else {
    searchParams.delete('dataUse')
  }

  if (filters.dataType.length > 0) {
    searchParams.set('dataType', filters.dataType.join(','))
  }
  else {
    searchParams.delete('dataType')
  }

  if (filters.dac.length > 0) {
    searchParams.set('dac', filters.dac.join(','))
  }
  else {
    searchParams.delete('dac')
  }

  if (filters.participantCount.min === undefined) {
    searchParams.delete('minParticipants')
  }
  else {
    searchParams.set('minParticipants', filters.participantCount.min.toString())
  }

  if (filters.participantCount.max === undefined) {
    searchParams.delete('maxParticipants')
  }
  else {
    searchParams.set('maxParticipants', filters.participantCount.max.toString())
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
    tab: (searchParams.get('tab') as AssetType) || AssetType.STUDIES,
    filters: parseFiltersFromUrl(searchParams),
    page: Number.parseInt(searchParams.get('page') || '0'),
    pageSize: Number.parseInt(searchParams.get('pageSize') || '25'),
    sortField: searchParams.get('sort') || undefined,
    sortOrder: (searchParams.get('order') as SortOrder) || undefined,
  }

  const updateState = (updates: Partial<LibraryUrlState>) => {
    const newParams = new URLSearchParams(searchParams)

    if (updates.library !== undefined) {
      if (updates.library) {
        newParams.set('library', updates.library)
      }
      else {
        newParams.delete('library')
      }
    }

    if (updates.tab !== undefined) {
      if (updates.tab) {
        newParams.set('tab', updates.tab)
      }
      else {
        newParams.delete('tab')
      }
    }

    if (updates.page !== undefined) {
      if (updates.page > 0) {
        newParams.set('page', updates.page.toString())
      }
      else {
        newParams.delete('page')
      }
    }

    if (updates.pageSize !== undefined) {
      if (updates.pageSize === 25) {
        newParams.delete('pageSize')
      }
      else {
        newParams.set('pageSize', updates.pageSize.toString())
      }
    }

    if (updates.sortField !== undefined) {
      if (updates.sortField) {
        newParams.set('sort', updates.sortField)
      }
      else {
        newParams.delete('sort')
      }
    }

    if (updates.sortOrder !== undefined) {
      if (updates.sortOrder) {
        newParams.set('order', updates.sortOrder)
      }
      else {
        newParams.delete('order')
      }
    }

    if (updates.filters !== undefined) {
      serializeFiltersToUrl(updates.filters, newParams)
    }

    setSearchParams(newParams)
  }

  return [state, updateState] as const
}
