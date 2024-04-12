import * as fp from 'lodash/fp';
import { Config } from '../config';
import axios from 'axios';
import { getApiUrl, fetchOk, getFileNameFromHttpResponse, fetchAny } from '../ajax';


export const DataSet = {
  getDatasetNames: async () => {
    const url = `${await getApiUrl()}/api/dataset/datasetNames`;
    const res = await axios.get(url, Config.authOpts());
    return await res.data;
  },

  getRegistrationSchema: async () => {
    const url = `${await getApiUrl()}/schemas/dataset-registration/v1`;
    const res = await axios.get(url, Config.authOpts());
    return await res.data;
  },

  postDatasetForm: async (form) => {
    const url = `${await getApiUrl()}/api/dataset/v2`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(form), { method: 'POST' }]));
    return await res.json();
  },

  registerDataset: async (registration) => {
    const url = `${await getApiUrl()}/api/dataset/v3`;
    const res = await axios.post(url, registration, Config.multiPartOpts());
    return res.data;
  },

  getDatasets: async () => {
    const url = `${await getApiUrl()}/api/dataset/v2`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDatasetsByIds: async (ids) => {
    const url = `${await getApiUrl()}/api/dataset/batch?ids=${ids.join('&ids=')}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  autocompleteDatasets: async (query) => {
    const url = `${await getApiUrl()}/api/dataset/autocomplete?query=${query}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  searchDatasetIndex: async (query) => {
    const url = `${await getApiUrl()}/api/dataset/search/index`;
    const res = await axios.post(url, query, Config.authOpts());
    return res.data;
  },

  getDataSetsByDatasetId: async (dataSetId) => {
    const url = `${await getApiUrl()}/api/dataset/v2/${dataSetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  downloadDataSets: async (objectIdList, fileName) => {
    const url = `${await getApiUrl()}/api/dataset/download`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(objectIdList), Config.fileOpts(), { method: 'POST' }]));

    fileName = fileName === null ? getFileNameFromHttpResponse(res) : fileName;
    const responseObj = await res.json();

    let blob = new Blob([responseObj.datasets], { type: 'text/plain' });
    const urlBlob = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = urlBlob;
    a.download = fileName;
    a.click();
  },

  deleteDataset: async (datasetObjectId) => {
    const url = `${await getApiUrl()}/api/dataset/${datasetObjectId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  updateDataset: async (datasetId, dataSetObject) => {
    const url = `${await getApiUrl()}/api/dataset/${datasetId}`;
    return await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(dataSetObject), { method: 'PUT' }]));
  },

  updateDatasetV3: async (datasetId, datasetAndFiles) => {
    const url = `${await getApiUrl()}/api/dataset/v3/${datasetId}`;
    const res = await axios.put(url, datasetAndFiles, Config.multiPartOpts());
    return res.data;
  },

  validateDatasetName: async (name) => {
    const url = `${await getApiUrl()}/api/dataset/validate?name=${name}`;
    try {
      // We expect a 404 in the case where the dataset name does not exist
      const res = await fetchAny(url, fp.mergeAll([Config.authOpts(), { method: 'GET' }]));
      if (res.status === 404) {
        return -1;
      }
      return await res.json();
    }
    catch (err) {
      return -1;
    }
  },

  getStudyById: async (studyId) => {
    const url = `${await getApiUrl()}/api/dataset/study/${studyId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updateStudy: async (studyId, studyObject) => {
    const url = `${await getApiUrl()}/api/dataset/study/${studyId}`;
    return await axios.put(url, studyObject, Config.multiPartOpts());
  },

  getDatasetByDatasetIdentifier: async (datasetIdentifier) => {
    const id = datasetIdentifier.toUpperCase();
    const url = `${await getApiUrl()}/api/tdr/${id}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  }
};
