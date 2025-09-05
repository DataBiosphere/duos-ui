import { useRef, useCallback } from 'react'

const useAsyncCacheFetch = (initialCache = {}) => {
  const cacheRef = useRef(initialCache)
  const fetchingRef = useRef({})

  const fetchWithCache = useCallback(async (id, fetchFn) => {
    if (cacheRef.current[id]) {
      return cacheRef.current[id]
    }
    if (fetchingRef.current[id]) {
      return fetchingRef.current[id]
    }
    fetchingRef.current[id] = fetchFn(id)
    const result = await fetchingRef.current[id]
    cacheRef.current[id] = result
    fetchingRef.current[id] = null
    return result
  }, [])

  const clearCache = useCallback((id) => {
    if (id) {
      delete cacheRef.current[id]
      delete fetchingRef.current[id]
    }
    else {
      cacheRef.current = {}
      fetchingRef.current = {}
    }
  }, [])

  return { fetchWithCache, clearCache }
}

export default useAsyncCacheFetch
