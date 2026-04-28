import { Config } from 'src/libs/config'
import { fetchPut, fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import type { DarCollection, DarCollectionSummary, UserRoleName } from 'src/types/model'

export const Collections = {
  cancelCollection: async (id: number, roleName: UserRoleName): Promise<DarCollection> => {
    const url = `${await Config.getApiUrl()}/api/collections/${id}/cancel`
    const config = { ...Config.authOpts(), params: { roleName } }
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

  getCollectionSummariesByRoleName: async (roleName: UserRoleName): Promise<DarCollectionSummary[]> => {
    const url = `${await Config.getApiUrl()}/api/collections/role/${roleName}/summary`
    const res = await fetchGet<DarCollectionSummary[]>(url, Config.authOpts())
    return res.data
  },

  getCollectionSummaryByRoleNameAndId: async ({ roleName, id }: { roleName: UserRoleName, id: number }): Promise<DarCollectionSummary> => {
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
