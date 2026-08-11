import { useCallback } from 'react'
import useAsyncCacheFetch from 'src/hooks/useAsyncCacheFetch'
import { DAC as Dac } from 'src/libs/ajax/DAC'
import { DACbotRule } from 'src/components/dac_bot/DACBotComponent'

/**
 * Fetches a DAC's DACbot rules, memoized for the lifetime of the calling component.
 *
 * DAC rules are near-static configuration, so paging, sorting, filtering and tab switches
 * reuse what has already been loaded instead of refetching. Concurrent callers for the same
 * DAC share a single in-flight request, which also collapses the separate radar and Signing
 * Official lookups into one request per DAC.
 */
export const useDacRules = (): ((dacId: number) => Promise<DACbotRule[]>) => {
  const { fetchWithCache } = useAsyncCacheFetch<number, DACbotRule[]>()
  return useCallback(
    (dacId: number) => fetchWithCache(dacId, Dac.fetchDACbotRules),
    [fetchWithCache],
  )
}

export default useDacRules
