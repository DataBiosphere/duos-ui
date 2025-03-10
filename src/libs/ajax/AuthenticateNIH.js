import axios from 'axios';
import {Config} from '../config';
import {getECMUrl, getApiUrl, reportError} from '../ajax';
import {get, isNil, merge} from 'lodash';

/**
 * ECM has several different providers such as `era-commons`, `ras`, `github`, `fence`, and others. DUOS has
 * historically used eRA Commons, but RAS is the new standard that Terra will be using. DUOS is moving in that direction
 * and will update as it is released to higher environments.
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

  getECMProviderAuthUrl: async (redirectUri, redirectTo) => {
    const url = `${await getECMUrl()}/api/oauth/v1/${provider}/authorization-url?redirectUri=${redirectUri}`;
    const res = await axios.post(url, {redirectTo: redirectTo}, Config.authOpts());
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

  getECMProviderLinkInfo: async (code, state) => {
    const url = `${await getECMUrl()}/api/oauth/v1/${provider}/oauthcode?state=${state}&oauthcode=${code}`;
    const res = await axios.post(url, null, Config.authOpts());
    if (res.status === 200) {
      return res.data;
    }
    return undefined;
  },

};
