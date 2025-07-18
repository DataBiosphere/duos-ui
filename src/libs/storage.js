import get from 'lodash/fp/get';
import { v4 as uuid } from 'uuid';

// Storage Variables
const CurrentUser = 'CurrentUser'; // System user
const OidcUser = 'OidcUser'; // B2C Tenant user info, including token
const UserIsLogged = 'isLogged'; // User log status flag
const UserSettings = 'UserSettings'; // Different user settings for saving statuses in the app
const anonymousId = 'anonymousId';
const ENV = 'env';

export const Storage = {
  clearStorage: () => {
    localStorage.clear();
  },

  /**
   * This user object is what we save in Consent
   * @param data
   */
  setCurrentUser: data => {
    localStorage.setItem(CurrentUser, JSON.stringify(data));
  },

  getCurrentUser: () => {
    return localStorage.getItem(CurrentUser) ? JSON.parse(localStorage.getItem(CurrentUser)) : null;
  },

  getCurrentUserSettings: (key) => {
    const id = Storage.getCurrentUser()?.userId || '';
    const userSettings = JSON.parse(localStorage.getItem(UserSettings)) || {};
    return get([id, key], userSettings);
  },

  getAnonymousId: () => {
    return localStorage.getItem(anonymousId) ? localStorage.getItem(anonymousId) : null;
  },

  setAnonymousId: (id = uuid()) => {
    return localStorage.setItem(anonymousId, id);
  },

  setCurrentUserSettings: (key, value) => {
    const id = Storage.getCurrentUser()?.userId || '';
    const userSettings = JSON.parse(localStorage.getItem(UserSettings)) || {};
    if (!userSettings[id]) {
      userSettings[id] = {};
    }
    userSettings[id][key] = value;
    localStorage.setItem(UserSettings, JSON.stringify(userSettings));
  },

  /**
   * This user object is returned from our B2C tenant
   * @param oidcUser
   */
  setOidcUser: oidcUser => {
    localStorage.setItem(OidcUser, JSON.stringify(oidcUser));
  },

  getOidcUser: () => {
    return localStorage.getItem(OidcUser) ? JSON.parse(localStorage.getItem(OidcUser)) : null;
  },

  userIsLogged: () => {
    const oidcUser = localStorage.getItem(OidcUser) ? JSON.parse(localStorage.getItem(OidcUser)) : null;
    return oidcUser && oidcUser.expires_at > Math.floor(Date.now() / 1000);
  },

  setData: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getData: key => {
    return localStorage.getItem(key) !== null ? JSON.parse(localStorage.getItem(key)) : null;
  },

  removeData: key => {
    localStorage.removeItem(key);
  },

  setEnv: (value) => {
    localStorage.setItem(ENV, value);
  },

  getEnv: () => {
    return localStorage.getItem(ENV);
  },
};
