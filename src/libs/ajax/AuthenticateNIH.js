import {Config} from '../config';
import {getApiUrl, getECMUrl, reportError} from '../ajax';
import axios from 'axios';
import {get, isNil, merge} from 'lodash';

/**
 * ECM has several different providers such as `era-commons`, `ras`, `github`, `fence`, and others.
 * @type {string}
 */
const provider = 'ras';

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
    const res = await axios.post(url, JSON.stringify(decodedData), merge(Config.authOpts(), {headers: {'Content-Type': 'application/json'}}));
    return await res.data;
  },

  deleteAccountLinkage: async () => {
    const url = `${await getApiUrl()}/api/nih`;
    return await axios.delete(url, Config.authOpts());
  },

  getECMAccountStatus: async () => {
    const url = `${await getECMUrl()}/api/oauth/v1/${provider}`;
    const res = await axios.get(url, Config.authOpts());
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

  getECMProviderAuthUrl: async (redirectUri, redirectTo) => {
    const url = `${await getECMUrl()}/api/oauth/v1/${provider}/authorization-url?redirectUri=${redirectUri}`;
    console.log('url', url);
    const res = await axios.post(url, {redirectTo: redirectTo}, Config.authOpts());
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

};
