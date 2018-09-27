import React from "react";
import { Route, Redirect } from "react-router-dom";
import { Storage } from "../libs/storage";

export default ({component: Component, props: componentProps, ...rest, rolesAllowed:rolesAllowed}) =>
  <Route
    {...rest}
    render={
      props =>
        verifyUser(rolesAllowed)
          ? <Component {...props} {...componentProps} />
          : <Redirect
            to={'/'}
          />}
  />;

  // Verifies if user is logged and if the user matches with any component allowed roles which is trying to navigate.
  const verifyUser = (allowedComponentRoles) => {
    if (Storage.userIsLogged()) {
      const usrRoles = Storage.getCurrentUser().roles.map(roles => roles.name);
      return allowedComponentRoles.some(
        componentRoles => usrRoles.indexOf(componentRoles) >= 0
      );
    }
    // User is not Logged
    return false;
  };
