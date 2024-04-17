import 'bootstrap/dist/css/bootstrap.min.css';

// jquery is needed for bootstrap
import 'jquery/src/jquery';
import 'bootstrap/dist/js/bootstrap.min';

import './index.css';
import { OidcBroker } from './libs/auth/oidcBroker';
import { unregister } from './registerServiceWorker';
import { Auth } from './libs/auth/auth';

const load = async (): Promise<void> => {
  unregister();
  await Auth.initialize();
  window.location.pathname.startsWith('/redirect-from-oauth')
    ? import('./libs/auth/oauth-redirect-loader')
    : import('./appLoader');
};

load();

