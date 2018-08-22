import React from "react";
import { Route, Redirect } from "react-router-dom";

export default ({ component: Component, props: componentProps, ...rest }) =>
    <Route
        {...rest}
        render = {
            props =>
            sessionStorage.getItem("isLogged") === 'true'
                ? <Component {...props} {...componentProps} />
                : <Redirect
                    to={'/'}
                />}
    />;