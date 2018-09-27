import { Storage } from "./storage";
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
      usrRoles.push('All');
      if (navigateInitalpage([USER_ROLES.chairperson], usrRoles)) {
        return 'chair_console';
      } else if (navigateInitalpage([USER_ROLES.member], usrRoles)) {
        return 'member_console';
      } else if (navigateInitalpage([USER_ROLES.admin], usrRoles)) {
        return 'admin_console';
      } else if (navigateInitalpage([USER_ROLES.researcher], usrRoles)) {
        return 'researcher_console';
      } else if (navigateInitalpage([USER_ROLES.alumni], usrRoles)) {
        return 'summary_votes';
      } else if (navigateInitalpage([USER_ROLES.dataOwner], usrRoles)) {
        return 'data_owner_console';
      }
    }
  };

const navigateInitalpage = (allowedComponentRoles, usrRoles) => {
  return allowedComponentRoles.some(
    componentRoles => usrRoles.indexOf(componentRoles) >= 0
  );
};
