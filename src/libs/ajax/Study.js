import { Config } from '../config'
import { fetchOk } from '../ajax'

export const Study = {
  getStudyNames: async () => {
    const url = `${await Config.getApiUrl()}/api/dataset/studyNames`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },
}
