import { UserManager } from 'oidc-client-ts';
import { useEffect } from 'react';
import { Spinner } from '../../components/Spinner';
import { OidcBroker } from './oidcBroker';
import React from "react";

const RedirectFromOAuth = (): JSX.Element => {
    const userManager: UserManager = new UserManager(OidcBroker.getOidcUserManagerSettings());
    console.log("inside redirect");
    const url = window.location.href;
    const isSilent = window.location.pathname.startsWith('/redirect-from-oauth-silent');
    useEffect(() => {
      if (isSilent) {
        userManager.signinSilentCallback(url);
      } else {
        userManager.signinPopupCallback(url);
      }
    }, []);
    const spinner: JSX.Element = Spinner;
    return spinner;
  };
  
  export default RedirectFromOAuth;