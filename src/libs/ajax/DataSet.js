import { Config } from 'src/libs/config'
import { fileDownload } from 'src/utils/FileDownload.js'
import { fetchDelete, fetchGet, fetchMultipart, fetchPost } from 'src/libs/ajax/fetchAdapter'

export const DataSet = {
  getDatasetNames: async () => {
    const url = `${await Config.getApiUrl()}/api/dataset/datasetNames`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  getRegistrationSchema: async () => {
    const url = `${await Config.getApiUrl()}/schemas/dataset-registration/v1`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  registerDataset: async (registration) => {
    const url = `${await Config.getApiUrl()}/api/dataset/v3`
    const res = await fetchMultipart(url, registration, Config.multiPartOpts(), 'POST')
    return res.data
  },

  getDatasetsByIds: async (ids) => {
    const url = `${await Config.getApiUrl()}/api/dataset/batch?ids=${ids.join('&ids=')}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  searchDatasetIndex: async (query, options = {}) => {
    const url = `${await Config.getApiUrl()}/api/dataset/search/index`
    const config = { ...Config.authOpts(), ...options }
    const res = await fetchPost(url, query, config)
    return res.data
  },

  searchDatasetIndexV2: async (query) => {
    const url = `${await Config.getApiUrl()}/api/dataset/search/index/v2`
    const res = await fetchPost(url, query, Config.authOpts())
    return res.data
  },

  getDataSetsByDatasetId: async (datasetId) => {
    const url = `${await Config.getApiUrl()}/api/dataset/v2/${datasetId}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  deleteDataset: async (datasetObjectId) => {
    const url = `${await Config.getApiUrl()}/api/dataset/${datasetObjectId}`
    await fetchDelete(url, Config.authOpts())
    return { status: 200 }
  },

  updateDatasetV3: async (datasetId, datasetAndFiles) => {
    const url = `${await Config.getApiUrl()}/api/dataset/v3/${datasetId}`
    const res = await fetchMultipart(url, datasetAndFiles, Config.multiPartOpts(), 'PUT')
    return res.data
  },

  getStudyById: async (studyId) => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },

  updateStudy: async (studyId, studyObject) => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchMultipart(url, studyObject, Config.multiPartOpts(), 'PUT')
    return res.data
  },

  getNIHInstitutionalCertification: async (datasetId) => {
    const datasetInfo = await DataSet.getDataSetsByDatasetId(datasetId)
    const fileName = datasetInfo.nihInstitutionalCertificationFile.fileName
    const authOpts = {
      ...Config.authOpts(),
      responseType: 'blob',
      headers: {
        ...Config.authOpts().headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/dataset/${datasetId}/nihInstitutionalCertification`
    const res = await fetchGet(url, authOpts)
    fileDownload(res.data, fileName)
  },

}
