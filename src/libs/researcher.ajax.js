import _ from 'lodash/fp'
import { Config } from './config'
import { fetchOk } from './ajax';

export const Researcher = {
  list: async dacUserId => {
    // return $resource(apiUrl + "researcher/:userId?validate=:validate", {}, {
    const url = `${await Config.getApiUrl()}/researcher/`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
};
