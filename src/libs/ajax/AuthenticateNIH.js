import { Config } from '../config';
import {getApiUrl, fetchOk, getECMUrl, reportError} from '../ajax';
import axios from 'axios';
import {mergeAll, getOr, isNil} from 'lodash/fp';


axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  // Default to a 502 when we can't get a real response object.
  const status = getOr(502)('response.status')(error);
  const reportUrl = getOr(null)('response.config.url')(error);
  if (!isNil(reportUrl) && status >= 500) {
    reportError(reportUrl, status);
  }
  return Promise.reject(error);
});

export const AuthenticateNIH = {
  saveNihUsr: async (decodedData) => {
    const url = `${await getApiUrl()}/api/nih`;
    const res = await fetchOk(url, mergeAll([Config.authOpts(), Config.jsonBody(decodedData), { method: 'POST' }]));
    return await res.json();
  },

  deleteAccountLinkage: async () => {
    const url = `${await getApiUrl()}/api/nih`;
    const res = await fetchOk(url, mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  getECMeRACommonsStatus: async () => {
    const url = `${await getECMUrl()}/api/oauth/v1/era-commons`;
    const res = await axios.get(url, Config.authOpts());
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

  getECMeRACommonsAuthUrl: async (redirectUri, redirectTo) => {
    const url = `${await getECMUrl()}/api/oauth/v1/era-commons/authorization-url`;
    const parameterBlock = {
      params: {
        scopes: ['openid', 'email', 'profile'],
        redirectUri: redirectUri,
        redirectTo: redirectTo
      },
      paramsSerializer: {
        indexes: null,
      }
    };
    const config = Object.assign({}, Config.authOpts(), parameterBlock);
    const res = await axios.get(url, config);
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

  postECMeRACommonsOauthcode: async (state, oauthcode) => {
    const url = `${await getECMUrl()}/api/oauth/v1/era-commons/oauthcode`;
    const data = {
      state: state,
      oauthcode: oauthcode
    };
    const res = await axios.post(url, data,  Config.authOpts());
    return res.data;
  }

};
