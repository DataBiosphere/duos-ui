import 'bootstrap/dist/css/bootstrap.min.css';

// jquery is needed for bootstrap
import 'jquery/src/jquery';
import 'bootstrap/dist/js/bootstrap.min';

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { unregister } from './registerServiceWorker';
import { BrowserRouter } from 'react-router-dom';
import { OidcBroker } from './libs/oidcBroker';
import { AuthProvider } from 'react-oidc-context';

unregister();

OidcBroker.initializeAuth().then(() => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(
    <BrowserRouter>
      <AuthProvider {...OidcBroker.getOidcUserManagerSettings()}>
        <App />
      </AuthProvider>
    </BrowserRouter>);
});


