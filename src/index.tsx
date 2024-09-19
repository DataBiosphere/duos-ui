import React from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import './styles/bootstrap_replacement.css';
import App from './App';
import {Auth} from './libs/auth/auth';
import {OidcBroker} from './libs/auth/oidcBroker';
import {unregister} from './registerServiceWorker';
import {BrowserRouter} from 'react-router-dom';

const load = async () => {
  unregister();
  await Auth.initialize();
  // The following handles the OIDC post-authentication flow.
  // 1. User clicks Sign In button
  // 2. OidcBroker instantiates a popup,
  // 3. User completes the auth dance and is redirected to this path
  // 4. Application (this component) detects that path and instructs the OidcBroker to close the popup
  // 5. After popup close, user is directed to the original url. This works for the cases we support:
  //   5a. Logging in from the home page
  //   5b. Logging in from a link, i.e. `<origin>/dataLibrary`
  //   5c. Logging in from a link with a `redirectTo` query param, i.e. `<origin>?redirectTo=/dataLibrary`
  if (window.location.pathname.startsWith('/redirect-from-oauth')) {
    await OidcBroker.getUserManager().signinPopupCallback(window.location.href);
  }
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<BrowserRouter><App/></BrowserRouter>);
};

await load();
