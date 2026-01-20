import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const Schema = {
  datasetRegistrationV1: async () => {
    const url = `${await Config.getApiUrl()}/schemas/dataset-registration/v1`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
}
