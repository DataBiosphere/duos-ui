import _ from 'lodash';
import {Storage} from './storage';

export const Config = {

  getEnv: async () => (await getConfig()).env,

  getApiUrl: async () => (await getConfig()).apiUrl,

  getBardApiUrl: async () => (await getConfig()).bardApiUrl, // Mixpanel

  getOntologyApiUrl: async () => (await getConfig()).ontologyApiUrl,

  getTdrApiUrl: async () => (await getConfig()).tdrApiUrl,

  getTerraUrl: async () => (await getConfig()).terraUrl,

  getProfileUrl: async () => (await getConfig()).profileUrl,

  getNihUrl: async () => (await getConfig()).nihUrl,

  getGoogleClientId: async () => (await getConfig()).clientId,

  getGAId: async () => (await getConfig()).gaId,

  getErrorApiKey: async () => (await getConfig()).errorApiKey,

  getHash: async () => (await getConfig()).hash,

  getTag: async () => (await getConfig()).tag,

  getFeatureFlag: async (featureName) => {
    const feature = _.get(await getConfig(), 'features', {});
    return _.get(feature, featureName, false);
  },

  getProject: async () => {
    const env = await Config.getEnv();
    switch (env) {
      case 'prod':
        return 'broad-duos-prod';
      default:
        return 'broad-duos-dev';
    }
  },

  authOpts: (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'X-App-ID': 'DUOS',
    },
  }),

  multiPartOpts: (token = Token.getToken()) => ({
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
      'X-App-ID': 'DUOS',
    },
  }),

  textPlain: () => ({
    headers: {
      Accept: 'text/plain',
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
