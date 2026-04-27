import { fetchGet, fetchPost, fetchPut, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { DacObject, Dataset, DuosUser } from 'src/types/model'
import { Config } from 'src/libs/config'
import { DACbotRule } from 'src/components/dac_bot/DACBotComponent'

type SuccessResponseCode = 200

type DacCreateInput = {
  name: string
  description: string
  email: string
}

type DacUpdateInput = DacCreateInput & {
  dacId: number
}

type DacApprovalInput = {
  approval: boolean
}

export type DacDeleteResponse = {
  status: number
}

export const DAC = {
  list: async (withUsers?: boolean): Promise<DacObject[]> => {
    const url = `${await Config.getApiUrl()}/api/dac` + (withUsers === undefined ? '' : `?withUsers=${withUsers}`)
    const res = await fetchGet<DacObject[]>(url, Config.authOpts())
    return res.data
  },

  create: async (name: string, description: string, email: string): Promise<DacObject> => {
    const url = `${await Config.getApiUrl()}/api/dac`
    const dac: DacCreateInput = { name, description, email }
    const res = await fetchPost<DacObject, DacCreateInput>(url, dac, Config.authOpts())
    return res.data
  },

  update: async (dacId: number, name: string, description: string, email: string): Promise<DacObject> => {
    const url = `${await Config.getApiUrl()}/api/dac`
    const dac: DacUpdateInput = { dacId, name, description, email }
    const res = await fetchPut<DacObject, DacUpdateInput>(url, dac, Config.authOpts())
    return res.data
  },

  delete: async (dacId: number): Promise<DacDeleteResponse> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}`
    await fetchDelete<void>(url, Config.authOpts())
    // Return object with status for backward compatibility
    return { status: 200 }
  },

  get: async (dacId: number): Promise<DacObject> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}`
    const res = await fetchGet<DacObject>(url, Config.authOpts())
    return res.data
  },

  datasets: async (dacId: number): Promise<Dataset[]> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/datasets`
    const res = await fetchGet<Dataset[]>(url, Config.authOpts())
    return res.data
  },

  autocompleteUsers: async (term: string): Promise<DuosUser[]> => {
    const url = `${await Config.getApiUrl()}/api/dac/users/${term}`
    const res = await fetchGet<DuosUser[]>(url, Config.authOpts())
    return res.data
  },

  addDacChair: async (dacId: number, userId: number): Promise<SuccessResponseCode> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/chair/${userId}`
    await fetchPost<void>(url, undefined, Config.authOpts())
    return 200
  },

  removeDacChair: async (dacId: number, userId: number): Promise<SuccessResponseCode> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/chair/${userId}`
    await fetchDelete<void>(url, Config.authOpts())
    return 200
  },

  updateApprovalStatus: async (dacId: number, datasetId: number, approvalStatus: boolean): Promise<Dataset> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/dataset/${datasetId}`
    const approval: DacApprovalInput = { approval: approvalStatus }
    const res = await fetchPut<Dataset, DacApprovalInput>(url, approval, Config.authOpts())
    return res.data
  },

  addDacMember: async (dacId: number, userId: number): Promise<SuccessResponseCode> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/member/${userId}`
    await fetchPost<void>(url, undefined, Config.authOpts())
    return 200
  },

  removeDacMember: async (dacId: number, userId: number): Promise<SuccessResponseCode> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/member/${userId}`
    await fetchDelete<void>(url, Config.authOpts())
    return 200
  },

  fetchDACbotRules: async (dacId: number): Promise<DACbotRule[]> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/rules`
    const res = await fetchGet<DACbotRule[]>(url, Config.authOpts())
    return res.data
  },

  toggleDACbotRule: async (dacId: number, ruleId: number): Promise<DACbotRule> => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/rules/${ruleId}/toggle`
    const res = await fetchPut<DACbotRule>(url, undefined, Config.authOpts())
    return res.data
  },
}
