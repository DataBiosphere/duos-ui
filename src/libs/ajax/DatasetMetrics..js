import { Config } from '../config';
import { getApiUrl, fetchOk } from '../ajax';


export const DatasetMetrics = {
  getDatasetStats: async (datasetId) => {
    const url = `${await getApiUrl()}/metrics/dataset/${datasetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  }
};
