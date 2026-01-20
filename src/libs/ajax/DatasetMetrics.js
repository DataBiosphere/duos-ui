import { Config } from '../config'
import { fetchOk } from '../ajax'

export const DatasetMetrics = {
  getDatasetStats: async (datasetId) => {
    const url = `${await Config.getApiUrl()}/metrics/dataset/${datasetId}`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },
}
