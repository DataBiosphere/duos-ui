import * as fp from 'lodash/fp';
import { getApiUrl, fetchOk } from '../ajax';
import { Config } from '../config';


export const DAA = {
  getDaas: async () => {
    const url = `${await getApiUrl()}/api/daa`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getDaaById: async (daaId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  createDaaLcLink: async (daaId, userId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  deleteDaaLcLink: async (daaId, userId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    // should we call json here?
    return res.json();
  }
};
