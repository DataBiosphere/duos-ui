import _ from 'lodash/fp'

const loadConfig = _.memoize(async () => {
    const res = await fetch('config.json')
    return res.json()
});

const getConfig = async () => {
    return await loadConfig()
};

export const getGoogleClientId = async () => (await getConfig()).clientId;

export const getApiUrl = async () => (await getConfig()).apiUrl;
