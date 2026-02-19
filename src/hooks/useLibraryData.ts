import { useQuery } from '@tanstack/react-query'
import { AssetType, FilterState, LibraryVersionNew, PaginationState, SortState } from 'src/types/library'

/**
 * Custom hook for fetching library data
 */
export const useLibraryData = (
  libraryConfig: LibraryVersionNew,
  assetType: AssetType,
  filters: FilterState,
  pagination: PaginationState,
  sort?: SortState,
) => {
  return useQuery({
    queryKey: [
      'library-data',
      libraryConfig.key,
      assetType,
      filters,
      pagination,
      sort,
    ],
    queryFn: async () => {
      return {
        items: [],
        total: 0,
        aggregations: {},
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    placeholderData: {
      items: [],
      total: 0,
      aggregations: {},
    },
  })
}
