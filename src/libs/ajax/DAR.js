import fileDownload from 'js-file-download';
import * as fp from 'lodash/fp';
import { isNil } from 'lodash/fp';
import { Config } from '../config';
import axios from 'axios';
import { isFileEmpty } from '../utils';
import { getApiUrl, fetchOk, getOntologyUrl, fetchAny } from '../ajax';
import {Metrics} from './Metrics';
import eventList from '../events';
import {Storage} from '../storage';

export const DAR = {
  //v2 get for DARs
  getPartialDarRequest: async (darId) => {
    const url = `${await getApiUrl()}/api/dar/v2/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  //v2 update for dar partials
  updateDarDraft: async (dar, referenceId) => {
    await Metrics.captureEvent(eventList.darUpdate);
    const url = `${await getApiUrl()}/api/dar/v2/draft/${referenceId}`;
    const res = await axios.put(url, dar, Config.authOpts());
    return res.data;
  },

  //api endpoint for v2 draft submission
  postDarDraft: async (dar) => {
    await Metrics.captureEvent(eventList.darDraft);
    const url = `${await getApiUrl()}/api/dar/v2/draft/`;
    const res = await axios.post(url, dar, Config.authOpts());
    return res.data;
  },

  //v2 delete dar
  deleteDar: async (darId) => {
    const url = `${await getApiUrl()}/api/dar/v2/${darId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  //v2 endpoint for DAR POST
  postDar: async (dar) => {
    await Metrics.captureEvent(eventList.darSubmit);
    const filteredDar = fp.omit(['createDate', 'sortDate', 'data_access_request_id'])(dar);
    const url = `${await getApiUrl()}/api/dar/v2`;
    const res = axios.post(url, filteredDar, Config.authOpts());
    return await res.data;
  },

  getAutoCompleteOT: async (partial) => {
    const url = `${await getOntologyUrl()}/autocomplete?q=${partial}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  searchOntologyIdList: async (ids) => {
    if (isNil(ids) || ids.length === 0) {
      return [];
    }
    const url = `${await getOntologyUrl()}/search?id=${ids}`;
    const res = await fetchAny(url, Config.authOpts());
    if (res.status >= 400) {
      return [];
    }
    return await res.json();
  },

  downloadDARDocument: async (referenceId, fileType, fileName) => {
    const authOpts = Object.assign(Config.authOpts(), { responseType: 'blob' });
    authOpts.headers = Object.assign(authOpts.headers, {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });
    const url = `${await getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`;
    axios.get(url, authOpts).then((response) => {
      fileDownload(response.data, fileName);
    });
  },

  //NOTE: endpoints requires a dar id
  uploadDARDocument: async (file, darId, fileType) => {
    if (isFileEmpty(file)) {
      return Promise.resolve({ data: null });
    } else {
      let authOpts = Config.authOpts();
      authOpts.headers['Content-Type'] = 'multipart/form-data';
      let formData = new FormData();
      formData.append('file', file);
      const url = `${await getApiUrl()}/api/dar/v2/${darId}/${fileType}`;
      return axios.post(url, formData, authOpts);
    }
  }
};
