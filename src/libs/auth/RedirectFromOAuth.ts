import { UserManager } from 'oidc-client-ts';
import { Spinner } from '../../components/Spinner';
import { OidcBroker } from './oidcBroker';

const RedirectFromOAuth = (): JSX.Element => {
  const userManager: UserManager = new UserManager(
    OidcBroker.getOidcUserManagerSettings()
  );
  const url = window.location.href;
  const isSilent = window.location.pathname.startsWith(
    '/redirect-from-oauth-silent'
  );

  if (isSilent) {
    userManager.signinSilentCallback(url);
  } else {
    userManager
      .signinPopupCallback(url).then(function () {
        console.log('signin popup callback response success');
      })
      .catch(function (err: unknown) {
        console.error(err);
        console.log(err);
      });
  }
  return Spinner;
};

export default RedirectFromOAuth;
