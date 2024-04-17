import { Config } from '../config';
import axios from 'axios';
import { getApiUrl } from '../ajax';


export const ToS = {
  getDUOSText: async () => {
    const env = await Config.getEnv();
    // When running locally, '/api' urls are rewritten in `setupProxy.js` so they're forwarded properly to the back end
    const baseUrl = env === 'local' ? '/api' : '';
    const url = `${await getApiUrl(baseUrl)}/tos/text/duos`;
    const res = await axios.get(url, Config.textPlain());
    return res.data;
  },
  /**
   * Returns a json structure of various statuses for an authenticated user.
   * See https://consent.dsde-prod.broadinstitute.org/#/Sam/get_api_sam_register_self_diagnostics
   * for more info.
   * {
   *   'adminEnabled': false,
   *   'enabled': false,
   *   'inAllUsersGroup': true,
   *   'inGoogleProxyGroup': false,
   *   'tosAccepted': true
   * }
   * @returns {Promise<any>}
   */
  getStatus: async () => {
    const url = `${await getApiUrl()}/api/sam/register/self/diagnostics`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  acceptToS: async () => {
    const url = `${await getApiUrl()}/api/sam/register/self/tos`;
    const res = await axios.post(url, {}, Config.authOpts());
    return res.data;
  },
  rejectToS: async () => {
    const url = `${await getApiUrl()}/api/sam/register/self/tos`;
    const res = await axios.delete(url, Config.authOpts());
    return res.data;
  }
};
