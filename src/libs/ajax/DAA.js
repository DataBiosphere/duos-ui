import { fileDownload } from 'src/utils/FileDownload'
import { Config } from 'src/libs/config'
import { isFileEmpty } from 'src/libs/utils'
import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  fetchMultipart,
} from 'src/libs/ajax/fetchAdapter'

export const DAA = {
  getDaas: async () => {
    const url = `${await Config.getApiUrl()}/api/daa`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  getDaaById: async (daaId) => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  createDaaLcLink: async (daaId, userId) => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/${userId}`
    const res = await fetchPut(url, {}, Config.authOpts())
    return res.data
  },

  deleteDaaLcLink: async (daaId, userId) => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/${userId}`
    const res = await fetchDelete(url, Config.authOpts())
    return res.data
  },

  bulkAddUsersToDaa: async (daaId, userList) => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/${daaId}`
    const res = await fetchPost(url, userList, Config.authOpts())
    return res.data
  },

  bulkRemoveUsersFromDaa: async (daaId, userList) => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/${daaId}`
    const res = await fetchDelete(url, { ...Config.authOpts(), data: userList })
    return res.data
  },

  bulkAddDaasToUser: async (userId, daaList) => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/user/${userId}`
    const res = await fetchPost(url, daaList, Config.authOpts())
    return res.data
  },

  bulkRemoveDaasFromUser: async (userId, daaList) => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/user/${userId}`
    const res = await fetchDelete(url, { ...Config.authOpts(), data: daaList })
    return res.data
  },

  getDaaFileById: async (daaId, daaFileName) => {
    const authOpts = {
      ...Config.authOpts(),
      responseType: 'blob',
      headers: {
        ...Config.authOpts().headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/file`
    const res = await fetchGet(url, authOpts)
    fileDownload(res.data, daaFileName)
  },

  createDaa: async (file, dacId) => {
    if (isFileEmpty(file)) {
      return Promise.resolve({ data: null })
    }
    else {
      const authOpts = Config.authOpts()
      // Do not set Content-Type for FormData; browser will set it
      const formData = new FormData()
      formData.append('file', file)
      const url = `${await Config.getApiUrl()}/api/daa/dac/${dacId}`
      return fetchMultipart(url, formData, authOpts)
    }
  },

  addDaaToDac: async (daaId, dacId) => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/dac/${dacId}`
    const res = await fetchPut(url, {}, Config.authOpts())
    return res.status
  },

  deleteDacDaaRelationship: async (daaId, dacId) => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/dac/${dacId}`
    return fetchDelete(url, Config.authOpts())
  },

  // NOTE: In the future, this functionality should be handled in the backend and should not be
  // dependent on the UI.
  sendDaaUpdateEmails: async (dacId, oldDaaId, newDaaName) => {
    const url = `${await Config.getApiUrl()}/api/daa/${dacId}/updated/${oldDaaId}/${newDaaName}`
    const res = await fetchPost(url, {}, Config.authOpts())
    return res.status
  },
}
