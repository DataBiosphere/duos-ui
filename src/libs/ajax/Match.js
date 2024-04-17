import { uniq } from 'lodash/fp';
import { Config } from '../config';
import axios from 'axios';
import { getApiUrl } from '../ajax';


export const Match = {
  findMatchBatch: async (purposeIdsArr = []) => {
    const purposeIds = uniq(purposeIdsArr).join(',');
    const url = `${await getApiUrl()}/api/match/purpose/batch`;
    const config = Object.assign({}, Config.authOpts(), { params: { purposeIds } });
    const res = await axios.get(url, config);
    return res.data;
  }
};
