import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { DatasetStatisticsDar } from 'src/types/model'

export const DatasetMetrics = {
  /**
   * Retrieve the DAR summary statistics for a dataset.
   * @param datasetId The ID of the dataset to fetch DAR statistics for
   * @returns Promise resolving to the list of DAR statistics for the dataset
   */
  getDatasetStats: async (datasetId: number): Promise<DatasetStatisticsDar[]> => {
    const url = `${await Config.getApiUrl()}/api/metrics/dar-summaries/${datasetId}`
    const res = await fetchGet<DatasetStatisticsDar[]>(url, Config.authOpts())
    return res.data
  },
}
