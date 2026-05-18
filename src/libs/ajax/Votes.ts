import { Config } from 'src/libs/config'
import { fetchPut } from 'src/libs/ajax/fetchAdapter'
import type { Vote } from 'src/types/model'

export const Votes = {
  /**
   * Update votes by their IDs.
   * @param voteIds Array of vote IDs to update
   * @param vote Vote object containing vote and rationale
   * @returns Promise resolving when the request completes (no data returned)
   */
  updateVotesByIds: async (
    voteIds: number[],
    vote: Pick<Vote, 'vote' | 'rationale'>,
  ): Promise<void> => {
    const voteUpdate = {
      vote: vote.vote,
      rationale: vote.rationale,
      voteIds: voteIds,
    }
    const url = `${await Config.getApiUrl()}/api/votes`
    await fetchPut(url, voteUpdate, Config.authOpts())
  },

  /**
   * Update rationale for votes by their IDs.
   * @param voteIds Array of vote IDs to update
   * @param rationale New rationale string
   * @returns Promise resolving when the request completes (no data returned)
   */
  updateRationaleByIds: async (
    voteIds: number[],
    rationale: string,
  ): Promise<void> => {
    const rationaleUpdate = {
      rationale: rationale,
      voteIds: voteIds,
    }
    const url = `${await Config.getApiUrl()}/api/votes/rationale`
    await fetchPut(url, rationaleUpdate, Config.authOpts())
  },
}
