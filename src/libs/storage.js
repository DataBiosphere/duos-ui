import get from 'lodash/fp/get';
import { v4 as uuid } from 'uuid';

// Storage Variables
const CurrentUser = 'CurrentUser'; // System user
const GoogleUser = 'Gapi'; // Google user info, including token
const OidcUser = 'OidcUser'; // Google user info, including token
const UserIsLogged = 'isLogged'; // User log status flag
const UserSettings = 'UserSettings'; // Different user settings for saving statuses in the app
const anonymousId = 'anonymousId';
const ENV = 'env';

export const Storage = {
  clearStorage: () => {
    sessionStorage.clear();
  },

  setCurrentUser: data => {
    sessionStorage.setItem(CurrentUser, JSON.stringify(data));
  },

  getCurrentUser: () => {
    return sessionStorage.getItem(CurrentUser) ? JSON.parse(sessionStorage.getItem(CurrentUser)) : null;
  },

  getCurrentUserRoles: () => {
    return sessionStorage.getItem(CurrentUser) ? JSON.parse(sessionStorage.getItem(CurrentUser)).roles : null;
  },

  getCurrentUserSettings: (key) => {
    const id = Storage.getCurrentUser()?.userId || '';
    const userSettings = JSON.parse(sessionStorage.getItem(UserSettings)) || {};
    return get([id, key], userSettings);
  },

  getAnonymousId: () => {
    return sessionStorage.getItem(anonymousId) ? sessionStorage.getItem(anonymousId) : null;
  },

  setAnonymousId: (id = uuid()) => {
    return sessionStorage.setItem(anonymousId, id);
  },

  setCurrentUserSettings: (key, value) => {
    const id = Storage.getCurrentUser()?.userId || '';
    let userSettings = JSON.parse(sessionStorage.getItem(UserSettings)) || {};
    if (!userSettings[id]) {
      userSettings[id] = {};
    }
    userSettings[id][key] = value;
    sessionStorage.setItem(UserSettings, JSON.stringify(userSettings));
  },

  setOidcUser: oidcUser => {
    sessionStorage.setItem(OidcUser, JSON.stringify(oidcUser));
  },

  getOidcUser: () => {
    return sessionStorage.getItem(OidcUser) ? JSON.parse(sessionStorage.getItem(OidcUser)) : null;
  },

  userIsLogged: () => {
    return sessionStorage.getItem(UserIsLogged) === 'true';
  },

  setUserIsLogged: value => {
    sessionStorage.setItem(UserIsLogged, value);
  },

  setData: (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  getData: key => {
    return sessionStorage.getItem(key) !== null ? JSON.parse(sessionStorage.getItem(key)) : null;
  },

  removeData: key => {
    sessionStorage.removeItem(key);
  },

  setEnv: (value) => {
    sessionStorage.setItem(ENV, value);
  },

  getEnv: () => {
    return sessionStorage.getItem(ENV);
  },
};
