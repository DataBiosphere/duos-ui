import get from 'lodash/fp/get';

// Storage Variables
const CurrentUser = 'CurrentUser'; // System user
const GoogleUser = 'Gapi'; // Google user info, including token
const UserIsLogged = 'isLogged'; // User log status flag
const UserSettings = 'UserSettings'; // Different user settings for saving statuses in the app

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
    const id = Storage.getCurrentUser()?.dacUserId || '';
    const userSettings = JSON.parse(sessionStorage.getItem(UserSettings)) || {};
    return get([id, key], userSettings);
  },

  setCurrentUserSettings: (key, value) => {
    const id = Storage.getCurrentUser()?.dacUserId || '';
    let userSettings = JSON.parse(sessionStorage.getItem(UserSettings)) || {};
    if (!userSettings[id]) {
      userSettings[id] = {};
    }
    userSettings[id][key] = value;
    sessionStorage.setItem(UserSettings, JSON.stringify(userSettings));
  },

  setGoogleData: data => {
    sessionStorage.setItem(GoogleUser, JSON.stringify(data));
  },

  getGoogleData: () => {
    return sessionStorage.getItem(GoogleUser) ? JSON.parse(sessionStorage.getItem(GoogleUser)) : null;
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
  }
};
