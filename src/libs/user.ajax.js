import _ from 'lodash/fp'
import { Config } from './config'
import { fetchOk } from './ajax';


export const User = {

  getByEmail: async email => {
    const url = `${await Config.getApiUrl()}/dacuser/${email}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  list: async () => {
    const url = `${await Config.getApiUrl()}/dacuser`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async user => {
    const url = `${await Config.getApiUrl()}/dacuser`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(user),
      { method: 'POST' }
    ]));
    return res.json();
  },

  update: async(user, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(user),
      { method: 'PUT' }
    ]));
    return res.json();
  },

  updateName: async(body, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(body),
      { method: 'PUT' }
    ]));
    return res.json();
  },

  validateDelegation: async(role, dacUser) => {
    const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(dacUser),
      { method: 'POST' }
    ]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${await Config.getApiUrl()}/user`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(user),
      { method: 'POST' }
    ]));
    return res.json();
  },

  registerStatus: async(userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(userRoleStatus),
      { method: 'PUT' }
    ]));
    return res.json();
  },

  findUserStatus:  async userId => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  }
};
