import { Config } from '../config';
import {getApiUrl, fetchOk, getECMUrl, reportError} from '../ajax';
import axios from 'axios';
import {get, isNil, merge} from 'lodash';


axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  // Default to a 502 when we can't get a real response object.
  const status = get(error, 'response.status', 502);
  const reportUrl = get(error, 'response.config.url', null);
  if (!isNil(reportUrl) && status >= 500) {
    reportError(reportUrl, status);
  }
  return Promise.reject(error);
});

export const AuthenticateNIH = {
  saveNihUsr: async (decodedData) => {
    const url = `${await getApiUrl()}/api/nih`;
    const res = await fetchOk(url, merge([Config.authOpts(), Config.jsonBody(decodedData), { method: 'POST' }]));
    return await res.json();
  },

  deleteAccountLinkage: async () => {
    const url = `${await getApiUrl()}/api/nih`;
    const res = await fetchOk(url, merge([Config.authOpts(), { method: 'DELETE' }]));
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
    const url = `${await getECMUrl()}/api/oauth/v1/era-commons/authorization-url?redirectUri=${redirectUri}`;
    console.log('url', url);
    const res = await axios.post(url, {redirectTo: redirectTo}, Config.authOpts());
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

};
