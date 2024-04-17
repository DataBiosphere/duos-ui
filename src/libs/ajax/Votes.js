import * as fp from 'lodash/fp';
import { Config } from '../config';
import { getApiUrl, fetchOk } from '../ajax';


export const Votes = {
  updateVotesByIds: async (voteIds, vote) => {
    const voteUpdate = {};
    voteUpdate.vote = vote.vote;
    voteUpdate.rationale = vote.rationale;
    voteUpdate.voteIds = voteIds;

    let url = `${await getApiUrl()}/api/votes`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(voteUpdate), { method: 'PUT' }]));
    return await res.json();
  },

  updateRationaleByIds: async (voteIds, rationale) => {
    const rationaleUpdate = {};
    rationaleUpdate.rationale = rationale;
    rationaleUpdate.voteIds = voteIds;

    let url = `${await getApiUrl()}/api/votes/rationale`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(rationaleUpdate), { method: 'PUT' }]));
    return await res.json();
  }
};
