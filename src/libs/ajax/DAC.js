import * as fp from 'lodash/fp';
import { getApiUrl, fetchOk } from '../ajax';
import { Config } from '../config';


export const DAC = {
  list: async (withUsers) => {
    const url = `${await getApiUrl()}/api/dac` + (fp.isEmpty(withUsers) ? '' : `?withUsers=${withUsers}`);
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async (name, description, email) => {
    const url = `${await getApiUrl()}/api/dac`;
    const dac = { name, description, email };
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(dac), { method: 'POST' }]));
    return res.json();
  },

  update: async (dacId, name, description, email) => {
    const url = `${await getApiUrl()}/api/dac`;
    const dac = { dacId, name, description, email };
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(dac), { method: 'PUT' }]));
    return res.json();
  },

  delete: async (dacId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    //we do not call .json() on res because the response has no body
    return res;
  },

  get: async (dacId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  datasets: async (dacId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}/datasets`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  autocompleteUsers: async (term) => {
    const url = `${await getApiUrl()}/api/dac/users/${term}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  addDacChair: async (dacId, userId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}/chair/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.status;
  },

  removeDacChair: async (dacId, userId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}/chair/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.status;
  },

  updateApprovalStatus: async (dacId, datasetId, approvalStatus) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}/dataset/${datasetId}`;
    const approval = { 'approval': approvalStatus };
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(approval), { method: 'PUT' }]));
    return res.json();
  },

  addDacMember: async (dacId, userId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}/member/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.status;
  },

  removeDacMember: async (dacId, userId) => {
    const url = `${await getApiUrl()}/api/dac/${dacId}/member/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.status;
  }
};
