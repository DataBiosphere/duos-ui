import { Config } from 'src/libs/config'
import { fetchPut, fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { DarCollection, DarCollectionSummary } from 'src/types/model'

export const Collections = {
  cancelCollection: async (id: number, roleName: string): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/cancel`
    const config = Object.assign({ params: { roleName } }, Config.authOpts())
    const res = await fetchPut<DarCollection>(url, {}, config)
    return res.data
  },

  reviseCollection: async (id: number): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/resubmit`
    const res = await fetchPut<DarCollection>(url, {}, Config.authOpts())
    return res.data
  },

  getCollectionById: async (id: number): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}`
    const res = await fetchGet<DarCollection>(url, Config.authOpts())
    return res.data
  },

  getCollectionByIdWithElectionHistory: async (id: number): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/electionHistory`
    const res = await fetchGet<DarCollection>(url, Config.authOpts())
    return res.data
  },

  getCollectionSummariesByRoleName: async (roleName: string): Promise<DarCollectionSummary[]> => {
    const url = `${await Config.getApiUrl()}/api/collections/role/${roleName}/summary`
    const res = await fetchGet<DarCollectionSummary[]>(url, Config.authOpts())
    return res.data
  },

  getCollectionSummaryByRoleNameAndId: async ({ roleName, id }: { roleName: string, id: number }): Promise<DarCollectionSummary> => {
    const url = `${await Config.getApiUrl()}/api/collections/role/${roleName}/summary/${id}`
    const res = await fetchGet<DarCollectionSummary>(url, Config.authOpts())
    return res.data
  },

  openElectionsById: async (id: number): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/election`
    const res = await fetchPost<DarCollection>(url, {}, Config.authOpts())
    return res.data
  },

  approveCollectionById: async (id: number): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/approve`
    const res = await fetchPost<DarCollection>(url, {}, Config.authOpts())
    return res.data
  },
}
