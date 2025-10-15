import { Config } from '../config'
import { getApiUrl, fetchOk } from '../ajax'
import { fetchPost, fetchPut, fetchPatch, fetchDelete } from 'src/libs/ajax/fetchAdapter'

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
    const res = await fetchPost(url, institution, Config.authOpts())
    return res.data
  },

  putInstitution: async (id, institution) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    const res = await fetchPut(url, institution, Config.authOpts())
    return res.data
  },

  patchInstitution: async (id, institution) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    const res = await fetchPatch(url, institution, Config.authOpts())
    return res.data
  },

  deleteInstitution: async (id) => {
    const url = `${await getApiUrl()}/api/institutions/${id}`
    const res = await fetchDelete(url, Config.authOpts())
    return res.data
  },
}
