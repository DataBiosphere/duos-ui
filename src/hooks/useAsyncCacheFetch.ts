import { useRef, useCallback } from 'react'

type FetchFn<K extends string | number, V> = (id: K) => Promise<V>

function useAsyncCacheFetch<K extends string | number, V>(
  initialCache: Record<K, V> = {} as Record<K, V>,
) {
  const cacheRef = useRef<Record<K, V>>(initialCache)
  const fetchingRef = useRef<Partial<Record<K, Promise<V>>>>({})

  const fetchWithCache = useCallback(
    async (id: K, fetchFn: FetchFn<K, V>): Promise<V> => {
      // Compared against undefined rather than truthiness so falsy cached values (0, '', false)
      // are served from the cache instead of refetching every call
      const cached = cacheRef.current[id]
      if (cached !== undefined) {
        return cached
      }
      if (fetchingRef.current[id] !== undefined) {
        return fetchingRef.current[id] as Promise<V>
      }
      const pending = fetchFn(id)
      fetchingRef.current[id] = pending
      try {
        const result = await pending
        cacheRef.current[id] = result
        return result
      }
      finally {
        // Cleared on failure too, so a transient error doesn't poison the key for good
        fetchingRef.current[id] = undefined
      }
    },
    [],
  )

  const clearCache = useCallback((id?: K) => {
    if (id !== undefined) {
      delete cacheRef.current[id]
      delete fetchingRef.current[id]
    }
    else {
      cacheRef.current = {} as Record<K, V>
      fetchingRef.current = {}
    }
  }, [])

  return { fetchWithCache, clearCache }
}

export default useAsyncCacheFetch
