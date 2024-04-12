import * as fp from 'lodash/fp';
import { Config } from '../config';
import { getApiUrl, fetchOk } from '../ajax';


export const AuthenticateNIH = {
  saveNihUsr: async (decodedData) => {
    const url = `${await getApiUrl()}/api/nih`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(decodedData), { method: 'POST' }]));
    return await res.json();
  },

  deleteAccountLinkage: async () => {
    const url = `${await getApiUrl()}/api/nih`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },
};
