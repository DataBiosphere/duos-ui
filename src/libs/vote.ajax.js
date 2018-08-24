import _ from 'lodash/fp'
import { Config } from './config'
import { fetchOk } from './ajax';

export const Votes = {
  find: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  listAllVotes: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postVote: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },

  updateVote: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  },


  findDar: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDarVote: async(requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },

  updateDarVote: async(requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  },
};
