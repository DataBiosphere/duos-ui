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

