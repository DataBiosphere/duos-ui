import { UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';
import { Config } from '../config';
import axios from 'axios'; // TODO: move this to ajax

interface OAuthConfig {
  clientId: string;
  authorityEndpoint: string;
}

let config: OAuthConfig | null = null;
let userManagerSettings: UserManagerSettings | null = null;

const generateOidcUserManagerSettings = async (
  config: OAuthConfig
): Promise<UserManagerSettings> => {
  const metadata = {
    authorization_endpoint: `${await Config.getApiUrl()}/oauth2/authorize`,
    token_endpoint: `${await Config.getApiUrl()}/oauth2/token`,
  };
  return {
    authority: config.authorityEndpoint,
    client_id: config.clientId,
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`,
    metadata,
    prompt: 'consent login',
    scope: 'openid email profile',
    stateStore: new WebStorageStateStore({ store: window.localStorage }),
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    automaticSilentRenew: true,
    // Time before access token expires when access token expiring event is fired
    accessTokenExpiringNotificationTimeInSeconds: 330,
    includeIdTokenInSilentRenew: true,
    extraQueryParams: { access_type: 'offline' },
    redirect_uri: '', // this field is not being used currently, but is expected from UserManager
  };
};

export const OidcBroker = {
  initializeAuth: async (): Promise<void> => {
    // TODO: Move request to an AJAX call
    const configUrl = `${await Config.getApiUrl()}/oauth2/configuration`;
    const res: OAuthConfig = (await axios.get(configUrl)).data;
    config = res;
    const ums: UserManagerSettings = await generateOidcUserManagerSettings(
      config
    );
    userManagerSettings = ums;
  },
  getOidcUserManagerSettings: (): UserManagerSettings => userManagerSettings!,
};
