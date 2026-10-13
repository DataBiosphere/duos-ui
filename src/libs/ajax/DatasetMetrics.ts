import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { DatasetStatisticsDar, IntellectualProperty, Presentation, Publication } from 'src/types/model'

export interface StudyResearchOutputs {
  presentations: Presentation[]
  publications: Publication[]
  intellectualProperties: IntellectualProperty[]
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
   * Retrieve presentations/publications/intellectual property researchers reported through
   * progress reports on this study's datasets.
   * @param studyId The ID of the study to fetch research outputs for
   */
  getResearchOutputs: async (studyId: number | string): Promise<StudyResearchOutputs> => {
    const url = `${await Config.getApiUrl()}/api/metrics/research-outputs/study/${studyId}`
    const res = await fetchGet<StudyResearchOutputs>(url, Config.authOpts())
    return res.data
  },
}
