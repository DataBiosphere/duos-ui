import _ from 'lodash/fp'
import { Storage } from './storage';


export const Config = {

  getApiUrl: async () => (await getConfig()).apiUrl,

  getOntologyApiUrl: async () => (await getConfig()).ontologyApiUrl,

  getNihUrl: async () => (await getConfig()).nihUrl,

  getGoogleClientId: async () => (await getConfig()).clientId,

  authOpts : (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  }),
  fileOpts : (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  }),
  jsonBody: body => ({
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }),
  fileBody: (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: '*/*'
    }
  }),
};

const Token = {
  getToken: () => {
    return Storage.getGoogleData() !== null ? Storage.getGoogleData().accessToken : 'token';
  }
};

const loadConfig = _.memoize(async () => {
  const res = await fetch('/config.json');
  return res.json()
});

const getConfig = async () => {
  return await loadConfig()
};
