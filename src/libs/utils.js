import Noty from 'noty';
import 'noty/lib/noty.css';
import 'noty/lib/themes/bootstrap-v3.css';
import { Config } from './config';
import isNil from 'lodash/fp/isNil';
import { forEach } from 'lodash';
import {Styles} from "./theme";

export const applyHoverEffects = (e, style) => {
  forEach(style, (value, key) => {
    e.target.style[key] = value;
  });
};

export const formatDate = (dateval) => {
  if (dateval === null || dateval === undefined) {
    return '---';
  }

  let dateFormat = new Date(dateval);
  let year = dateFormat.getFullYear();
  let month = ('0' + (dateFormat.getMonth() + 1)).slice(-2);
  let day = ('0' + dateFormat.getDate()).slice(-2);
  let datestr = year + '-' + month + '-' + day;
  return datestr;
};

//Custom empty check needed on File
//lodash's isEmpty checks for enumerated keys, something a File does not have (ends up being an empty array)
//leads to incorrect evaluation of File
export const isFileEmpty = (file) => {
  return isNil(file) || file.size < 1 || file.length < 1;
};

export const USER_ROLES = {
  admin: 'Admin',
  chairperson: 'Chairperson',
  member: 'Member',
  researcher: 'Researcher',
  alumni: 'Alumni',
  dataOwner: 'DataOwner',
  all: 'All'
};

export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

export const getDatasetNames = (datasets) => {
  if(!datasets){return '';}
  const datasetNames = datasets.map((dataset) => {
    return dataset.label;
  });
  return datasetNames.join('\n');
};

export const applyTextHover = (e) => {
  e.target.style.color = Styles.TABLE.DAR_TEXT_HOVER.color;
  e.target.style.cursor = Styles.TABLE.DAR_TEXT_HOVER.cursor;
};

export const removeTextHover = (e, color) => {
  e.target.style.color = color;
};

export const setUserRoleStatuses = (user, Storage) => {
  const currentUserRoles = user.roles.map(roles => roles.name);
  user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
  user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
  user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
  user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
  user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
  user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
  Storage.setCurrentUser(user);
  return user;
};

export const Navigation = {
  back: (user, history) => {
    const page = user.isChairPerson ? NavigationUtils.dacChairConsolePath()
      : user.isMember ? '/member_console'
        : user.isAdmin ? '/admin_console'
          : user.isResearcher ? '/dataset_catalog'
            : user.isDataOwner ? '/data_owner_console'
              : user.isAlumni ? '/summary_votes'
                : '/';
    history.push(page);
  },
  console: (user, history) => {
    const page = user.isChairPerson ? NavigationUtils.dacChairConsolePath()
      : user.isMember ? '/member_console'
        : user.isAdmin ? '/admin_console'
          : user.isResearcher ? '/researcher_console'
            : user.isDataOwner ? '/data_owner_console'
              : user.isAlumni ? '/summary_votes'
                : '/';
    history.push(page);
  }
};

export const download = (fileName, text) => {
  const break_line = '\r\n \r\n';
  text = break_line + text;
  let blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = fileName + '-restriction';
  a.click();
};

export const Notifications = {
  defaultNotification: {
    layout: 'bottomRight',
    timeout: '3500',
    progressBar: false,
    type: 'error',
    theme: 'bootstrap-v3',
  },
  /**
   * @param props: pass in properties like 'text', 'timeout', 'layout', and 'progressBar'.
   * See https://ned.im/noty/#/options for more customization options.
   */
  showError: props => {
    return new Noty({
      text: 'Something went wrong. Please try again.',
      ...Notifications.defaultNotification,
      ...props,
    }).show();
  },
  /**
   * @param props: pass in properties like 'text', 'timeout', 'layout', and 'progressBar'.
   * See https://ned.im/noty/#/options for more customization options.
   */
  showSuccess: props => {
    return new Noty({
      text: 'Congratulations',
      ...Notifications.defaultNotification,
      ...props,
      type: 'success',
    }).show();
  },
  showWarning: props => {
    return new Noty({
      text: 'Warning!',
      ...Notifications.defaultNotification,
      ...props,
      type: 'warning',
    }).show();
  },
  showInformation: props => {
    return new Noty({
      text: 'Information',
      ...Notifications.defaultNotification,
      ...props,
      type: 'information',
    }).show();
  },
};

export const NavigationUtils = {
  accessReviewPath: () => {
    return "access_review";
  },
  dacChairConsolePath: async () => {
    const newChairConsoleEnabled = await Config.getFeatureFlag('newChairConsole');
    return newChairConsoleEnabled ? "/new_chair_console" : "/chair_console";
  }
};

/**
 * Serialize the execution of an array of promise functions
 *
 * See https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
 * @param funcs: List of functions that return a promise
 * @returns Array of promise results
 * @constructor
 */
export const PromiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result =>
      func().then(Array.prototype.concat.bind(result))),
  Promise.resolve([]));
