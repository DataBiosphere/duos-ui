import { Config } from 'src/libs/config'
import { fetchPut } from 'src/libs/ajax/fetchAdapter'
import type { Vote } from 'src/types/model'

export const Votes = {
  /**
   * Update votes by their IDs.
   * @param voteIds Array of vote IDs to update
   * @param vote Vote object containing vote and rationale
   * @returns Promise resolving to the updated list of votes
   */
  updateVotesByIds: async (
    voteIds: number[],
    vote: Pick<Vote, 'vote' | 'rationale'>,
  ): Promise<Vote[]> => {
    const voteUpdate = {
      vote: vote.vote,
      rationale: vote.rationale,
      voteIds: voteIds,
    }
    const url = `${await Config.getApiUrl()}/api/votes`
    const res = await fetchPut<Vote[]>(url, voteUpdate)
    return res.data
  },

  /**
   * Update rationale for votes by their IDs.
   * @param voteIds Array of vote IDs to update
   * @param rationale New rationale string
   * @returns Promise resolving to the updated list of votes
   */
  updateRationaleByIds: async (
    voteIds: number[],
    rationale: string,
  ): Promise<Vote[]> => {
    const rationaleUpdate = {
      rationale: rationale,
      voteIds: voteIds,
    }
    const url = `${await Config.getApiUrl()}/api/votes/rationale`
    const res = await fetchPut<Vote[]>(url, rationaleUpdate)
    return res.data
  },
}
