import fileDownload from 'js-file-download';
import { getApiUrl } from '../ajax';
import { Config } from '../config';
import { isFileEmpty } from '../utils';
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
    const res = await axios.delete(url, { ...Config.authOpts(), data: userList });
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

  getDaaFileById: async (daaId, daaFileName) => {
    const authOpts = Object.assign(Config.authOpts(), { responseType: 'blob' });
    authOpts.headers = Object.assign(authOpts.headers, {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });
    const url = `${await getApiUrl()}/api/daa/${daaId}/file`;
    axios.get(url, authOpts).then((response) => {
      fileDownload(response.data, daaFileName);
    });
  },

  createDaa: async (file, dacId) => {
    if (isFileEmpty(file)) {
      return Promise.resolve({ data: null });
    } else {
      let authOpts = Config.authOpts();
      authOpts.headers['Content-Type'] = 'multipart/form-data';
      let formData = new FormData();
      formData.append('file', file);
      const url = `${await getApiUrl()}/api/daa/dac/${dacId}`;
      return axios.post(url, formData, authOpts);
    }
  },

  addDaaToDac: async (daaId, dacId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/dac/${dacId}`;
    const res = await axios.put(url, {}, Config.authOpts());
    return res.status;
  },

  deleteDaa: async (daaId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}`;
    const res = await axios.delete(url, Config.authOpts());
    return res;
  },

  deleteDacDaaRelationship: async (daaId, dacId) => {
    const url = `${await getApiUrl()}/api/daa/${daaId}/dac/${dacId}`;
    const res = await axios.delete(url, Config.authOpts());
    return res;
  },

  // NOTE: In the future, this functionality should be handled in the backend and should not be
  // dependent on the UI.
  sendDaaUpdateEmails: async (dacId, oldDaaId, newDaaName) => {
    const url = `${await getApiUrl()}/api/daa/${dacId}/updated/${oldDaaId}/${newDaaName}`;
    const res = await axios.post(url, {}, Config.authOpts());
    return res.status;
  }
};