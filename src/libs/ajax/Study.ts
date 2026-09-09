import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { Study as StudyModel } from 'src/types/model'

export const Study = {
  /**
   * Retrieves all study names registered in the system.
   * @returns Promise resolving to an array of study name strings
   */
  getStudyNames: async (): Promise<string[]> => {
    const url = `${await Config.getApiUrl()}/api/dataset/studyNames`
    const res = await fetchGet<string[]>(url, Config.authOpts())
    return res.data
  },

  /**
   * Fetches a study from the relational store, not the Elasticsearch-backed search index the
   * study page uses elsewhere, for fields the index doesn't carry — PI institution and external
   * profile links.
   *
   * The only implementation of this endpoint: `DataSet.getStudyById` delegates here, typing the
   * same payload as the data-submission form's editable `Study` shape rather than this one.
   */
  getById: async <T = StudyModel>(studyId: number | string): Promise<T> => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchGet<T>(url, Config.authOpts())
    return res.data
  },
}
