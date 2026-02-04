import { isEmpty } from 'lodash'
import { fetchGet, fetchPost, fetchPut, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { Config } from '../config'

export const DAC = {
  list: async (withUsers) => {
    const url = `${await Config.getApiUrl()}/api/dac` + (isEmpty(withUsers) ? '' : `?withUsers=${withUsers}`)
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  create: async (name, description, email) => {
    const url = `${await Config.getApiUrl()}/api/dac`
    const dac = { name, description, email }
    const res = await fetchPost(url, dac, Config.authOpts())
    return res.data
  },

  update: async (dacId, name, description, email) => {
    const url = `${await Config.getApiUrl()}/api/dac`
    const dac = { dacId, name, description, email }
    const res = await fetchPut(url, dac, Config.authOpts())
    return res.data
  },

  delete: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}`
    await fetchDelete(url, Config.authOpts())
    // Return object with status for backward compatibility
    return { status: 200 }
  },

  get: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  datasets: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/datasets`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  autocompleteUsers: async (term) => {
    const url = `${await Config.getApiUrl()}/api/dac/users/${term}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  addDacChair: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/chair/${userId}`
    await fetchPost(url, undefined, Config.authOpts())
    return 200
  },

  removeDacChair: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/chair/${userId}`
    await fetchDelete(url, Config.authOpts())
    return 200
  },

  updateApprovalStatus: async (dacId, datasetId, approvalStatus) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/dataset/${datasetId}`
    const approval = { approval: approvalStatus }
    const res = await fetchPut(url, approval, Config.authOpts())
    return res.data
  },

  addDacMember: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/member/${userId}`
    await fetchPost(url, undefined, Config.authOpts())
    return 200
  },

  removeDacMember: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/member/${userId}`
    await fetchDelete(url, Config.authOpts())
    return 200
  },

  fetchDACbotRules: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/rules`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  toggleDACbotRule: async (dacId, ruleId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/rules/${ruleId}/toggle`
    const res = await fetchPut(url, undefined, Config.authOpts())
    return res.data
  },
}
