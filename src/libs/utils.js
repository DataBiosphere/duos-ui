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

export const rolesHandler = (userRoles) => {
  let user = {};

  const currentUserRoles = userRoles.map(roles => roles.name);
  user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
  user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
  user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
  user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
  user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
  user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
  return user;
};

// returns the initial page to be redirected when a user logs in
export const redirect =
  (roles) => {
    let page = '/';
    if (Storage.userIsLogged()) {
      page = roles.isChairPerson ? 'chair_console' :
             roles.isMember ? 'member_console' :
             roles.isAdmin ? 'admin_console' :
             roles.isResearcher ? 'dataset_catalog' :
             roles.isDataOwner ? 'data_owner_console' :
             roles.isAlumni ? 'summary_votes' : '/';
    }
    return page
  };
