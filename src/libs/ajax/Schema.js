import { Config } from '../config';
import axios from 'axios';
import { getApiUrl } from '../ajax';


export const Schema = {
  datasetRegistrationV1: async () => {
    const url = `${await getApiUrl()}/schemas/dataset-registration/v1`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  }
};
