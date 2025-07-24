import { mergeAll } from 'lodash/fp'
import { Config } from '../config'
import axios from 'axios'
import { getApiUrl, fetchOk } from '../ajax'

export const Institution = {
  list: async () => {
    const url = `${await getApiUrl()}/api/institutions`
    const res = await fetchOk(url, Config.authOpts())
    return res.json()
  },

  getById: async (id) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    const res = await fetchOk(url, Config.authOpts())
    return res.json()
  },

  postInstitution: async (institution) => {
    const url = `${await getApiUrl()}/api/institutions`
    const res = await axios.post(url, institution, Config.authOpts())
    return res.data
  },

  putInstitution: async (id, institution) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    const res = await axios.put(url, institution, Config.authOpts())
    return res.data
  },

  patchInstitution: async (id, institution) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    const res = await axios.patch(url, institution, Config.authOpts())
    return res.data
  },

  deleteInstitution: async (id) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    return await fetchOk(url, mergeAll([Config.authOpts(), { method: 'DELETE' }]))
  },
}
