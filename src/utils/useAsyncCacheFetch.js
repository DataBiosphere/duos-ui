import { useRef } from 'react'

const useAsyncCacheFetch = (initialCache = {}) => {
  const cacheRef = useRef(initialCache)
  const fetchingRef = useRef({})

  return async (id, fetchFn) => {
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
  }
}

export default useAsyncCacheFetch
