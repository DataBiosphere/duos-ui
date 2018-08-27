import _ from 'lodash/fp'

const auth_token = "tokennnnnnnnn";

export const Config = {
  loadConfig: _.memoize(async () => {
    const res = await fetch('config.json');
    return res.json()
<<<<<<< HEAD
});

const getConfig = async () => {
    return await loadConfig()
};

export const getGoogleClientId = async () => (await getConfig()).clientId;

=======
  }),

  getApiUrl: async () => (await getConfig()).apiUrl,

  authOpts: (token = auth_token) => ({
    headers: { Authorization: `Bearer ${token}` }
  }),

  jsonBody: body => ({
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }),
};

const loadConfig = _.memoize(async () => {
  const res = await fetch('config.json');
  return res.json()
});

const getConfig = async () => {
  return await loadConfig()
};

export const getGoogleClientId = async () => (await getConfig()).clientId;

>>>>>>> more-modal-fixes
export const getApiUrl = async () => (await getConfig()).apiUrl;
