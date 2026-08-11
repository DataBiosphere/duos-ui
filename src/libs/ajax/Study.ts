import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const Study = {
  /**
   * Retrieves all study names registered in the system.
   * @returns Promise resolving to an array of study name strings
   */
  getStudyNames: async (): Promise<string[]> => {
    const url = `${await Config.getApiUrl()}/api/dataset/studyNames`
    const res = await fetchGet<string[]>(url)
    return res.data
  },
}
