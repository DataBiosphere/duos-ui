import { Config } from 'src/libs/config'
import { fetchPut, fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'

export const Collections = {
  cancelCollection: async (id, roleName) => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/cancel`
    const config = Object.assign({ params: { roleName } }, Config.authOpts())
    const res = await fetchPut(url, {}, config)
    return res.data
  },
  reviseCollection: async (id) => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/resubmit`
    const res = await fetchPut(url, {}, Config.authOpts())
    return res.data
  },
  getCollectionById: async (id) => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
  getCollectionByIdWithElectionHistory: async (id) => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/electionHistory`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
  getCollectionSummariesByRoleName: async (roleName) => {
    const url = `${await Config.getApiUrl()}/api/collections/role/${roleName}/summary`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
  getCollectionSummaryByRoleNameAndId: async ({ roleName, id }) => {
    const url = `${await Config.getApiUrl()}/api/collections/role/${roleName}/summary/${id}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
  openElectionsById: async (id) => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/election`
    const res = await fetchPost(url, {}, Config.authOpts())
    return res.data
  },
}
