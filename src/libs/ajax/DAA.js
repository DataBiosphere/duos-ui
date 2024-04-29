import * as fp from 'lodash/fp';
import { getApiUrl, fetchOk } from '../ajax';
import { Config } from '../config';
import axios from 'axios';


export const DAA = {
  getDaas: async () => {
    const url = `${await getApiUrl()}/api/daa`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getDaaById: async (daaId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  createDaaLcLink: async (daaId, userId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/${userId}`;
    const res = await axios.put(url, {}, Config.authOpts());
    return res.data;
  },

  deleteDaaLcLink: async (daaId, userId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/${userId}`;
    const res = await axios.delete(url, Config.authOpts());
    return res.data;
  },

  bulkAddUsersToDaa: async (daaId, userList) => {
    const url = `${await getApiUrl()}/api/daa/bulk/${daaId}`;
    const res = await axios.post(url, userList, Config.authOpts());
    return res.data;
  },

  bulkRemoveUsersFromDaa: async (daaId, userList) => {
    const url = `${await getApiUrl()}/api/daa/bulk/${daaId}`;
    const res = await axios.delete(url, userList, Config.authOpts());
    return res.data;
  },

  bulkAddDaasToUser: async (userId, daaList) => {
    const url = `${await getApiUrl()}/api/daa/bulk/user/${userId}`;
    const res = await axios.post(url, daaList, Config.authOpts());
    return res.data;
  },

  bulkRemoveDaasFromUser: async (userId, daaList) => {
    const url = `${await getApiUrl()}/api/daa/bulk/user/${userId}`;
    const res = await axios.delete(url, { ...Config.authOpts(), data: daaList });
    return res.data;
  }, 

  getDaaFileById: async (daaId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/file`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
};
