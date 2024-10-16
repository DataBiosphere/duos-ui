import * as fp from 'lodash/fp';
import { Config } from '../config';
import axios from 'axios';
import { getApiUrl, fetchOk } from '../ajax';


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

  registerDataset: async (registration) => {
    const url = `${await getApiUrl()}/api/dataset/v3`;
    const res = await axios.post(url, registration, Config.multiPartOpts());
    return res.data;
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

  getDataSetsByDatasetId: async (datasetId) => {
    const url = `${await getApiUrl()}/api/dataset/v2/${datasetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  deleteDataset: async (datasetObjectId) => {
    const url = `${await getApiUrl()}/api/dataset/${datasetObjectId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  updateDatasetV3: async (datasetId, datasetAndFiles) => {
    const url = `${await getApiUrl()}/api/dataset/v3/${datasetId}`;
    const res = await axios.put(url, datasetAndFiles, Config.multiPartOpts());
    return res.data;
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
