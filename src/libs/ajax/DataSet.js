import axios from 'axios'
import { mergeAll } from 'lodash/fp'
import { Config } from 'src/libs/config'
import { fetchOk, getApiUrl } from 'src/libs/ajax'
import { fileDownload } from 'src/utils/FileDownload.js'

// FIXME: temporary read-only mode for NHGRI datasets
const setNhgriExternalAccess = (datasets) => {
  return datasets.map((d) => {
    // nhgri dac id in prod is 2, verified in db
    if (d.dacId === 2 && d.accessManagement === 'controlled') {
      d.accessManagement = 'external'
    }
    return d
  })
}

export const DataSet = {
  getDatasetNames: async () => {
    const url = `${await getApiUrl()}/api/dataset/datasetNames`
    const res = await axios.get(url, Config.authOpts())
    return await res.data
  },

  getRegistrationSchema: async () => {
    const url = `${await getApiUrl()}/schemas/dataset-registration/v1`
    const res = await axios.get(url, Config.authOpts())
    return await res.data
  },

  registerDataset: async (registration) => {
    const url = `${await getApiUrl()}/api/dataset/v3`
    const res = await axios.post(url, registration, Config.multiPartOpts())
    return res.data
  },

  getDatasetsByIds: async (ids) => {
    const url = `${await getApiUrl()}/api/dataset/batch?ids=${ids.join('&ids=')}`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },

  searchDatasetIndex: async (query) => {
    const url = `${await getApiUrl()}/api/dataset/search/index`
    const res = await axios.post(url, query, Config.authOpts())
    return setNhgriExternalAccess(res.data)
  },

  getDataSetsByDatasetId: async (datasetId) => {
    const url = `${await getApiUrl()}/api/dataset/v2/${datasetId}`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },

  deleteDataset: async (datasetObjectId) => {
    const url = `${await getApiUrl()}/api/dataset/${datasetObjectId}`
    return await fetchOk(url, mergeAll([Config.authOpts(), { method: 'DELETE' }]))
  },

  updateDatasetV3: async (datasetId, datasetAndFiles) => {
    const url = `${await getApiUrl()}/api/dataset/v3/${datasetId}`
    const res = await axios.put(url, datasetAndFiles, Config.multiPartOpts())
    return res.data
  },

  getStudyById: async (studyId) => {
    const url = `${await getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchOk(url, Config.authOpts())
    return await res.json()
  },

  updateStudy: async (studyId, studyObject) => {
    const url = `${await getApiUrl()}/api/dataset/study/${studyId}`
    return await axios.put(url, studyObject, Config.multiPartOpts())
  },

  getNIHInstitutionalCertification: async (datasetId) => {
    const datasetInfo = await DataSet.getDataSetsByDatasetId(datasetId)
    const fileName = datasetInfo.nihInstitutionalCertificationFile.fileName
    const authOpts = Object.assign(Config.authOpts(), { responseType: 'blob' })
    authOpts.headers = Object.assign(authOpts.headers, {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream',
    })
    const url = `${await getApiUrl()}/api/dataset/${datasetId}/nihInstitutionalCertification`
    axios.get(url, authOpts).then((response) => {
      fileDownload(response.data, fileName)
    })
  },
}
