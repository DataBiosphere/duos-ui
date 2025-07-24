import { Config } from '../config'
import { getApiUrl } from '../ajax'
import axios from 'axios'

export const Votes = {
  updateVotesByIds: async (voteIds, vote) => {
    const voteUpdate = {}
    voteUpdate.vote = vote.vote
    voteUpdate.rationale = vote.rationale
    voteUpdate.voteIds = voteIds

    const url = `${await getApiUrl()}/api/votes`
    const res = await axios.put(url, voteUpdate, Config.authOpts())
    return res.data
  },

  updateRationaleByIds: async (voteIds, rationale) => {
    const rationaleUpdate = {}
    rationaleUpdate.rationale = rationale
    rationaleUpdate.voteIds = voteIds

    const url = `${await getApiUrl()}/api/votes/rationale`
    const res = await axios.put(url, rationaleUpdate, Config.authOpts())
    return res.data
  },
}
