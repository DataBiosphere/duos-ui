import { fileDownload } from '../../utils/FileDownload'
import { isNil, mergeAll, omit } from 'lodash/fp'
import { Config } from '../config'
import { isFileEmpty } from '../utils'
import { fetchAny, fetchOk } from '../ajax'
import { DAAUtils } from '../../utils/DAAUtils'
import { Metrics } from './Metrics'
import eventList from '../events'
import { fetchGet, fetchMultipart, fetchPost, fetchPut } from 'src/libs/ajax/fetchAdapter'

export const DAR = {
  // v2 get for DARs
  getPartialDarRequest: async (darId) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  // v2, v3 Draft DAR Update
  updateDarDraft: async (dar, referenceId) => {
    Metrics.captureEvent(eventList.dar, { action: 'update' })
    const url = DAAUtils.isEnabled()
      ? `${await Config.getApiUrl()}/api/dar/v3/draft/${referenceId}`
      : `${await Config.getApiUrl()}/api/dar/v2/draft/${referenceId}`
    const res = await fetchPut(url, dar, Config.authOpts())
    return res.data
  },

  // v2, v3 Draft DAR Creation
  postDarDraft: async (dar) => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'draft' })
    const url = DAAUtils.isEnabled()
      ? `${await Config.getApiUrl()}/api/dar/v3/draft`
      : `${await Config.getApiUrl()}/api/dar/v2/draft`
    const res = await fetchPost(url, dar, Config.authOpts())
    return res.data
  },

  // v2 delete dar
  deleteDar: async (darId) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}`
    // fetchAdapter.js has fetchDelete, but fetchOk is used for custom handling; keeping as is
    return await fetchOk(url, mergeAll([Config.authOpts(), { method: 'DELETE' }]))
  },

  // v2, v3 DAR Creation
  postDar: async (dar) => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'submit' })
    const filteredDar = omit(['createDate', 'data_access_request_id'])(dar)
    const url = DAAUtils.isEnabled()
      ? `${await Config.getApiUrl()}/api/dar/v3`
      : `${await Config.getApiUrl()}/api/dar/v2`
    const res = await fetchPost(url, filteredDar, Config.authOpts())
    return res.data
  },

  getAutoCompleteOT: async (partial) => {
    const url = `${await Config.getOntologyUrl()}/autocomplete?q=${partial}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  searchOntologyIdList: async (ids) => {
    if (isNil(ids) || ids.length === 0) {
      return []
    }
    const url = `${await Config.getOntologyUrl()}/search?id=${ids}`
    const res = await fetchAny(url, Config.authOpts())
    if (res.status >= 400) {
      return []
    }
    return await res.json()
  },

  downloadDARDocument: async (referenceId, fileType, fileName) => {
    const authOpts = {
      ...Config.authOpts(),
      responseType: 'blob',
      headers: {
        ...Config.authOpts().headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`
    const res = await fetchGet(url, authOpts)
    fileDownload(res.data, fileName)
  },

  getDARDocumentAsBlob: async (referenceId, fileType) => {
    const authOpts = {
      ...Config.authOpts(),
      responseType: 'blob',
      headers: {
        ...Config.authOpts().headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`
    const res = await fetchGet(url, authOpts)
    return res.data
  },

  // NOTE: endpoints requires a dar id
  uploadDARDocument: async (file, darId, fileType) => {
    if (isFileEmpty(file)) {
      return Promise.resolve({ data: null })
    }
    else {
      const authOpts = Config.authOpts()
      // Do not set Content-Type for FormData; browser will set it
      const formData = new FormData()
      formData.append('file', file)
      const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}/${fileType}`
      return fetchMultipart(url, formData, authOpts)
    }
  },

  approveCloseout: async (referenceId) => {
    const url = `${await Config.getApiUrl()}/api/dar/${referenceId}/approveCloseout`
    const res = await fetchPut(url, {}, Config.authOpts())
    return res.status
  },
}
