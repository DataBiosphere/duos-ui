import { Config } from '../config'
import { fetchPut } from 'src/libs/ajax/fetchAdapter'

export const Votes = {
  updateVotesByIds: async (voteIds, vote) => {
    const voteUpdate = {
      vote: vote.vote,
      rationale: vote.rationale,
      voteIds: voteIds,
    }
    const url = `${await Config.getApiUrl()}/api/votes`
    const res = await fetchPut(url, voteUpdate, Config.authOpts())
    return res.data
  },

  updateRationaleByIds: async (voteIds, rationale) => {
    const rationaleUpdate = {
      rationale: rationale,
      voteIds: voteIds,
    }
    const url = `${await Config.getApiUrl()}/api/votes/rationale`
    const res = await fetchPut(url, rationaleUpdate, Config.authOpts())
    return res.data
  },
}
