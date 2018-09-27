import { Storage } from "./storage";
import { Researcher } from "./ajax";
import React from "react";

export const formatDate = (dateval) => {
  let dateFormat = new Date(dateval);
  let year = dateFormat.getFullYear();
  let month = ('0' + dateFormat.getMonth()).slice(-2);
  let day = ('0' + dateFormat.getDate()).slice(-2);
  let datestr = year + '-' + month + '-' + day;
  return datestr;
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

// returns the initial page to be redirected when a user logs in
export const redirect =
  () => {
    if (Storage.userIsLogged()) {
      const usrRoles = Storage.getCurrentUser().roles.map(roles => roles.name);
      let page = '';
      for (let role of usrRoles) {
        if (role === USER_ROLES.chairperson) {
          page = 'chair_console';
          break;
        }
        if (role === USER_ROLES.member) {
          page = 'member_console';
          break;
        }
        if (role === USER_ROLES.admin) {
          page = 'admin_console';
          break;
        }
        if (role === USER_ROLES.researcher) {
          page = 'dataset_catalog';
          break;
        }
        if (role === USER_ROLES.dataOwner) {
          page = 'data_owner_console';
          break;
        }
        if (role === USER_ROLES.alumni) {
          page = 'summary_votes';
          break;
        }
      }
      return page;
    }
  };
