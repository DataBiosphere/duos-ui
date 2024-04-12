import * as fp from 'lodash/fp';
import { cloneDeep, flow, unset } from 'lodash/fp';
import { Config } from '../config';
import axios from 'axios';
import { getApiUrl, fetchOk, fetchAny } from '../ajax';


export const User = {
  getMe: async () => {
    const url = `${await getApiUrl()}/api/user/me`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getById: async (id) => {
    const url = `${await getApiUrl()}/api/user/${id}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  list: async (roleName) => {
    const url = `${await getApiUrl()}/api/user/role/${roleName}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async (user) => {
    const url = `${await getApiUrl()}/api/dacuser`;
    try {
      const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
      if (res.ok) {
        return res.json;
      }
    } catch (err) {
      return false;
    }
  },

  updateSelf: async (payload) => {
    const url = `${await getApiUrl()}/api/user`;
    // We should not be updating the user's create date, associated institution, or library cards
    try {
      const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(payload), { method: 'PUT' }]));
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  update: async (user, userId) => {
    const url = `${await getApiUrl()}/api/user/${userId}`;
    // We should not be updating the user's create date, associated institution, or library cards
    let filteredUser = flow(
      cloneDeep,
      unset('updatedUser.createDate'),
      unset('updatedUser.institution'),
      unset('updatedUser.libraryCards')
    )(user);
    try {
      const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(filteredUser), { method: 'PUT' }]));
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  registerUser: async () => {
    const url = `${await getApiUrl()}/api/user`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.json();
  },

  getSOsForCurrentUser: async () => {
    const url = `${await getApiUrl()}/api/user/signing-officials`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'GET' }]));
    return res.json();
  },

  getUnassignedUsers: async () => {
    const url = `${await getApiUrl()}/api/user/institution/unassigned`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  addRoleToUser: async (userId, roleId) => {
    const url = `${await getApiUrl()}/api/user/${userId}/${roleId}`;
    const res = await fetchAny(url, fp.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return res.json();
  },

  deleteRoleFromUser: async (userId, roleId) => {
    const url = `${await getApiUrl()}/api/user/${userId}/${roleId}`;
    const res = await fetchAny(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.json();
  },
  getUserRelevantDatasets: async () => {
    const url = `${await getApiUrl()}/api/user/me/dac/datasets`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  getAcknowledgements: async () => {
    const url = `${await getApiUrl()}/api/user/acknowledgements`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  acceptAcknowledgments: async (...keys) => {
    if (keys.length === 0) {
      return {};
    }

    const url = `${await getApiUrl()}/api/user/acknowledgements`;
    const res = await axios.post(url, keys, Config.authOpts());
    return res.data;
  },
  getApprovedDatasets: async () => {
    const url = `${await getApiUrl()}/api/user/me/researcher/datasets`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  }
};
