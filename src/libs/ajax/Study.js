import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const Study = {
  getStudyNames: async () => {
    const url = `${await Config.getApiUrl()}/api/dataset/studyNames`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
}
