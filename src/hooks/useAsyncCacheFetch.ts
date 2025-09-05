import { useRef, useCallback } from 'react'

type FetchFn<K extends string | number, V> = (id: K) => Promise<V>

function useAsyncCacheFetch<K extends string | number, V>(
  initialCache: Record<K, V> = {} as Record<K, V>,
) {
  const cacheRef = useRef<Record<K, V>>(initialCache)
  const fetchingRef = useRef<Partial<Record<K, Promise<V>>>>({})

  const fetchWithCache = useCallback(
    async (id: K, fetchFn: FetchFn<K, V>): Promise<V> => {
      if (cacheRef.current[id]) {
        return cacheRef.current[id]
      }
      if (fetchingRef.current[id]) {
        return fetchingRef.current[id] as Promise<V>
      }
      fetchingRef.current[id] = fetchFn(id)
      const result = await fetchingRef.current[id]!
      cacheRef.current[id] = result
      fetchingRef.current[id] = undefined
      return result
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
