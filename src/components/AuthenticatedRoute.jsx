import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { Storage } from '../libs/storage';
import * as Utils from '../libs/utils';
import Home from '../pages/Home';


const AuthenticatedRoute = ({ component: Component, props: componentProps, rolesAllowed, ...rest }) => {

  const { path, location, requiresLibraryCard } = rest;

  return (
    <Route
      path={ path }
      location={ location }
      render={
        props =>
          verifyUser(rolesAllowed, Storage.getCurrentUser(), componentProps, requiresLibraryCard)
            ? <Component { ...props } { ...componentProps } />
            : !Storage.userIsLogged()
              ? <Home { ...props } { ...componentProps } />
              : <Redirect to={ '/' }/>
      }
    />
  );
};

// Verifies if user is logged and if the user matches with any component allowed roles which is trying to navigate.
const verifyUser = (allowedComponentRoles, usrRoles, _componentProps, requiresLibraryCard) => {
  if (requiresLibraryCard && (!usrRoles || !usrRoles.libraryCards || !usrRoles.libraryCards.length > 0)) {return false;}
  if (Storage.userIsLogged() && usrRoles !== undefined) {
    const currentUserRoles = (usrRoles.roles) ? usrRoles.roles.map(roles => roles.name) : [];
    return allowedComponentRoles.some(
      componentRole => (currentUserRoles.indexOf(componentRole) >= 0 || componentRole === Utils.USER_ROLES.all)
    );
  }
  // User is not Logged
  return false;
};

export default AuthenticatedRoute;
