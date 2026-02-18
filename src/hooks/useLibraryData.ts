import { useQuery } from '@tanstack/react-query'
import { AssetType, FilterState, LibraryVersionNew } from 'src/types/library'

/**
 * Custom hook for fetching library data
 */
export const useLibraryData = (
  libraryConfig: LibraryVersionNew,
  assetType: AssetType,
  filters: FilterState,
) => {
  return useQuery({
    queryKey: [
      'library-data',
      libraryConfig.key,
      assetType,
      filters,
    ],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    placeholderData: {
      items: [],
    },
  })
}
