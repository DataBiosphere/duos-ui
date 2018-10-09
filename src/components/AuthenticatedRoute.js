import React from "react";
import { Route, Redirect } from "react-router-dom";
import { Storage } from "../libs/storage";
import * as Utils from "../libs/utils";
import Login from '../pages/Login';

export default ({ component: Component, props: componentProps, ...rest, rolesAllowed, path }) =>
  <Route
    {...rest}
    render={
      props =>
        verifyUser(rolesAllowed, Storage.getCurrentUser(), path)
          ? <Component {...props} {...componentProps} />
          : <Login {...props} {...componentProps}
            re={path}
          />}
  />;

  /*
  <Login props={props}
            re={path}
          />
  * */


//     <Route path='/login' component={() => <Login {...props}/>} />
// to={{pathname: '/login', props:Component}}

// Verifies if user is logged and if the user matches with any component allowed roles which is trying to navigate.
const verifyUser = (allowedComponentRoles, usrRoles, component) => {
  console.log(component);
  if (Storage.userIsLogged() && usrRoles) {
    const currentUserRoles = usrRoles.roles.map(roles => roles.name);
    return allowedComponentRoles.some(
      componentRole => (currentUserRoles.indexOf(componentRole) >= 0 || componentRole === Utils.USER_ROLES.all)
    );
  }
  // User is not Logged
  return false;
};
