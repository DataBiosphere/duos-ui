import _ from 'lodash';
import {Storage} from './storage';

export const Config = {

  getEnv: async () => (await getConfig()).env,

  getApiUrl: async () => (await getConfig()).apiUrl,

  getOntologyApiUrl: async () => (await getConfig()).ontologyApiUrl,

  getFireCloudUrl: async () => (await getConfig()).firecloudUrl,

  getProfileUrl: async () => (await getConfig()).profileUrl,

  getNihUrl: async () => (await getConfig()).nihUrl,

  getGoogleClientId: async () => (await getConfig()).clientId,

  getGAId: async () => (await getConfig()).gaId,

  getFeatureFlag: async (featureName) => {
    const feature = _.get(await getConfig(), 'features', {});
    return _.get(feature, featureName, false);
  },

  authOpts: (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'X-App-ID': 'DUOS',
    },
  }),

  fileOpts: (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  }),

  jsonBody: body => ({
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'},
  }),

  attachmentBody: body => ({
    body: body,
    headers: {'Content-Type': 'application/binary'}
  }),

  fileBody: (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    },
  }),
};

const Token = {
  getToken: () => {
    return Storage.getGoogleData() !== null ?
      Storage.getGoogleData().accessToken :
      'token';
  },
};

const loadConfig = _.memoize(async () => {
  const res = await fetch('/config.json');
  return res.json();
});

const getConfig = async () => {
  return await loadConfig();
};
