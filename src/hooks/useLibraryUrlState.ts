import { useSearchParams } from 'react-router-dom'
import { AssetType, LibraryUrlState } from 'src/types/library'

const updateParams = (params: URLSearchParams, updates: Partial<LibraryUrlState>, key: string) => {
  const value = updates[key as keyof LibraryUrlState]
  if (value !== undefined) {
    if (value) {
      params.set(key, value)
    }
    else {
      params.delete(key)
    }
  }
  return params
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
  }

  const updateState = (updates: Partial<LibraryUrlState>) => {
    let newParams = new URLSearchParams(searchParams)

    newParams = updateParams(newParams, updates, 'library')
    newParams = updateParams(newParams, updates, 'tab')

    setSearchParams(newParams)
  }

  return [state, updateState] as const
}
