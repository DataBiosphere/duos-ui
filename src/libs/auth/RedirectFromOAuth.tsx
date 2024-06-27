import React from 'react';
import { createRoot } from 'react-dom/client';
import { OidcBroker } from './oidcBroker';
import { Spinner } from '../../components/Spinner';
import { UserManager } from 'oidc-client-ts';

const userManager: UserManager = new UserManager(
  OidcBroker.getUserManagerSettings()
);
const url = window.location.href;
const isSilent = window.location.pathname.startsWith(
  '/redirect-from-oauth-silent'
);

if (isSilent) {
  userManager.signinSilentCallback(url);
} else {
  userManager.signinPopupCallback(url);
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);
root.render(<Spinner />);
