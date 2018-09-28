import React from "react";
import { Route, Redirect } from "react-router-dom";
import { Storage } from "../libs/storage";
import * as Utils from "../libs/utils";

export default ({ component: Component, props: componentProps, ...rest, rolesAllowed }) =>
  <Route
    {...rest}
    render={
      props =>
        verifyUser(rolesAllowed, Storage.getCurrentUser().roles)
          ? <Component {...props} {...componentProps} />
          : <Redirect
            to={'/'}
          />}
  />;

// Verifies if user is logged and if the user matches with any component allowed roles which is trying to navigate.
const verifyUser = (allowedComponentRoles, usrRoles) => {
  if (Storage.userIsLogged() && usrRoles) {
    const currentUserRoles = usrRoles.map(roles => roles.name);
    return allowedComponentRoles.some(
      componentRole => (currentUserRoles.indexOf(componentRole) >= 0 || componentRole === Utils.USER_ROLES.all)
    );
  }
  // User is not Logged
  return false;
};
