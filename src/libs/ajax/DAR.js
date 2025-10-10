import { fileDownload } from '../../utils/FileDownload'
import { isNil, mergeAll, omit } from 'lodash/fp'
import { Config } from '../config'
import axios from 'axios'
import { isFileEmpty } from '../utils'
import { getApiUrl, fetchOk, getOntologyUrl, fetchAny } from '../ajax'
import { DAAUtils } from '../../utils/DAAUtils'
import { Metrics } from './Metrics'
import eventList from '../events'

export const DAR = {
  // v2 get for DARs
  getPartialDarRequest: async (darId) => {
    const url = `${await getApiUrl()}/api/dar/v2/${darId}`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },

  // v2, v3 Draft DAR Update
  updateDarDraft: async (dar, referenceId) => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'update' })
    const url = DAAUtils.isEnabled()
      ? `${await getApiUrl()}/api/dar/v3/draft/${referenceId}`
      : `${await getApiUrl()}/api/dar/v2/draft/${referenceId}`
    const res = await axios.put(url, dar, Config.authOpts())
    return res.data
  },

  // v2, v3 Draft DAR Creation
  postDarDraft: async (dar) => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'draft' })
    const url = DAAUtils.isEnabled()
      ? `${await getApiUrl()}/api/dar/v3/draft`
      : `${await getApiUrl()}/api/dar/v2/draft`
    const res = await axios.post(url, dar, Object.assign({}, Config.authOpts(), { validateStatus: () => true }))
    return res.data
  },

  // v2 delete dar
  deleteDar: async (darId) => {
    const url = `${await getApiUrl()}/api/dar/v2/${darId}`
    const res = await fetchOk(url, mergeAll([Config.authOpts(), { method: 'DELETE' }]))
    return await res
  },

  // v2, v3 DAR Creation
  postDar: async (dar) => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'submit' })
    const filteredDar = omit(['createDate', 'sortDate', 'data_access_request_id'])(dar)
    const url = DAAUtils.isEnabled()
      ? `${await getApiUrl()}/api/dar/v3`
      : `${await getApiUrl()}/api/dar/v2`
    return axios.post(url, filteredDar, Config.authOpts())
  },

  getAutoCompleteOT: async (partial) => {
    const url = `${await getOntologyUrl()}/autocomplete?q=${partial}`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },

  searchOntologyIdList: async (ids) => {
    if (isNil(ids) || ids.length === 0) {
      return []
    }
    const url = `${await getOntologyUrl()}/search?id=${ids}`
    const res = await fetchAny(url, Config.authOpts())
    if (res.status >= 400) {
      return []
    }
    return await res.json()
  },

  downloadDARDocument: async (referenceId, fileType, fileName) => {
    const authOpts = Object.assign(Config.authOpts(), { responseType: 'blob' })
    authOpts.headers = Object.assign(authOpts.headers, {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream',
    })
    const url = `${await getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`
    axios.get(url, authOpts).then((response) => {
      fileDownload(response.data, fileName)
    })
  },

  getDARDocumentAsBlob: async (referenceId, fileType) => {
    const authOpts = Object.assign(Config.authOpts(), { responseType: 'blob' })
    authOpts.headers = Object.assign(authOpts.headers, {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream',
    })
    const url = `${await getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`
    const response = await axios.get(url, authOpts)
    return response.data
  },

  // NOTE: endpoints requires a dar id
  uploadDARDocument: async (file, darId, fileType) => {
    if (isFileEmpty(file)) {
      return Promise.resolve({ data: null })
    }
    else {
      const authOpts = Config.authOpts()
      authOpts.headers['Content-Type'] = 'multipart/form-data'
      const formData = new FormData()
      formData.append('file', file)
      const url = `${await getApiUrl()}/api/dar/v2/${darId}/${fileType}`
      return axios.post(url, formData, authOpts)
    }
  },

  approveCloseout: async (referenceId) => {
    const url = `${await getApiUrl()}/api/dar/${referenceId}/approveCloseout`
    return axios.put(url, {}, Config.authOpts())
  },
}
