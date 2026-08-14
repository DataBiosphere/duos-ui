import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { DatasetStatisticsDar } from 'src/types/model'

export interface DarTrendMonth {
  period: string
  approvedCount: number
  deniedCount: number
}

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

  /**
   * Retrieve the DAR summary statistics across every dataset in a study.
   * @param studyId The ID of the study to fetch DAR statistics for
   * @returns Promise resolving to the de-duplicated list of DAR statistics for the study
   */
  getStudyStats: async (studyId: number | string): Promise<DatasetStatisticsDar[]> => {
    const url = `${await Config.getApiUrl()}/api/metrics/dar-summaries/study/${studyId}`
    const res = await fetchGet<DatasetStatisticsDar[]>(url, Config.authOpts())
    return res.data
  },

  /**
   * Retrieve monthly approved-vs-denied DAR election outcome counts across a study's datasets.
   * @param studyId The ID of the study to fetch the DAR trend for
   * @returns Promise resolving to the chronological list of monthly counts
   */
  getDarTrend: async (studyId: number | string): Promise<DarTrendMonth[]> => {
    const url = `${await Config.getApiUrl()}/api/metrics/dar-trend/study/${studyId}`
    const res = await fetchGet<DarTrendMonth[]>(url, Config.authOpts())
    return res.data
  },
}
