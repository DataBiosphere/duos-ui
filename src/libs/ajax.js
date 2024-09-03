import {getOr, isNil} from 'lodash/fp';
import {Auth} from './auth/auth';
import {Config} from './config';
import {spinnerService} from './spinner-service';
import {StackdriverReporter} from './stackdriverReporter';
import axios from 'axios';

//define axios interceptor
//to log out user and redirect to home when response has 401 status
//return responses with statuses in the 200s and reject the rest
const redirectOnLogout = () => {
  Auth.signOut();
  window.location.href = `/home?redirectTo=${window.location.pathname}`;
};

axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  // Default to a 502 when we can't get a real response object.
  const status = getOr(502)('response.status')(error);
  if (status === 401) {
    redirectOnLogout();
  }

  const reportUrl = getOr(null)('response.config.url')(error);
  if (!isNil(reportUrl) && status >= 500) {
    reportError(reportUrl, status);
  }

  return Promise.reject(error);
});

export const getApiUrl = async(baseUrl = '') => {
  const env = await Config.getEnv();
  return env === 'local' ? baseUrl : await Config.getApiUrl();
};

export const getBardApiUrl = async() => {
  return await Config.getBardApiUrl();
};

export const getOntologyUrl = async(baseUrl = '') => {
  const env = await Config.getEnv();
  return env === 'local' ? baseUrl : await Config.getOntologyApiUrl();
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const fetchOk = async (...args) => {
  //TODO: Remove spinnerService calls
  spinnerService.showAll();
  const res = await fetch(...args);
  if (!res.ok && res.status === 401) {
    redirectOnLogout();
  }
  if (res.status >= 400) {
    await reportError(args[0], res.status);
  }
  spinnerService.hideAll();
  return res.ok ? res : Promise.reject(res);
};

export const fetchAny = async (...args) => {
  //TODO: Remove spinnerService calls
  spinnerService.showAll();
  const res = await fetch(...args);
  if (!res.ok && res.status === 401) {
    redirectOnLogout();
  }
  if (res.status >= 500) {
    await reportError(args[0], res.status);
  }
  spinnerService.hideAll();
  return res;
};

export const getFileNameFromHttpResponse = (response) => {
  const respHeaders = response.headers;
  return respHeaders.get('Content-Disposition').split(';')[1].trim().split('=')[1];
};

export const reportError = async (url, status) => {
  const msg = 'Error fetching response: '
    .concat(JSON.stringify(url))
    .concat('Status: ')
    .concat(status);
  await StackdriverReporter.report(msg);
};
