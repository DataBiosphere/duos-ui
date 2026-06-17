import { uniq } from 'src/utils/NodashUtil'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { MatchResult } from 'src/types/model'

export const Match = {
  /**
   * Fetch match results for a batch of purpose IDs, deduplicating the input list.
   * @param purposeIdsArr Array of purpose (DAR reference) IDs to look up
   * @returns Array of MatchResult objects for the given purpose IDs
   */
  findMatchBatch: async (purposeIdsArr: string[] = []): Promise<MatchResult[]> => {
    const purposeIds = uniq(purposeIdsArr).join(',')
    const url = `${await Config.getApiUrl()}/api/match/purpose/batch`
    const config = { ...Config.authOpts(), params: { purposeIds } }
    const res = await fetchGet<MatchResult[]>(url, config)
    return res.data
  },
}
