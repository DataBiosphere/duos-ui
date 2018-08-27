import React from "react";
import { Route, Redirect } from "react-router-dom";
import { Storage } from "../libs/ajax";

export default ({component: Component, props: componentProps, ...rest}) =>
  <Route
    {...rest}
    render={
      props =>
        Storage.userIsLogged()
          ? <Component {...props} {...componentProps} />
          : <Redirect
            to={'/'}
          />}
  />;