
// Storage Variables

const CurrentUser = "CurrentUser"; // System user
const GoogleUser = "Gapi"; // Google user info, including token
const UserIsLogged = "isLogged"; // User log status flag

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
  }
};