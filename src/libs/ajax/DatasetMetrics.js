import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const DatasetMetrics = {
  getDatasetStats: async (datasetId) => {
    const url = `${await Config.getApiUrl()}/api/metrics/dar-summaries/${datasetId}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
}
