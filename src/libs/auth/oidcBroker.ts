import {
  IdTokenClaims,
  OidcMetadata,
  SigninPopupArgs,
  User,
  UserManager,
  UserManagerSettings,
  WebStorageStateStore
} from 'oidc-client-ts';

import {Config} from '../config';
import {OAuth2, OAuthConfig} from '../ajax/OAuth2';

export interface B2cIdTokenClaims extends IdTokenClaims {
    email_verified?: boolean;
    idp?: string;
    idp_access_token?: string;
    tid?: string;
    ver?: string;
}

export interface OidcUser extends User {
    profile: B2cIdTokenClaims;
}

let config: OAuthConfig | null = null;
let userManagerSettings: UserManagerSettings | null = null;
let userManager: UserManager | null = null;

const generateOidcUserManagerSettings = async (
  config: OAuthConfig
): Promise<UserManagerSettings> => {
  const metadata: Partial<OidcMetadata> = {
    authorization_endpoint: `${await Config.getApiUrl()}/oauth2/authorize`,
    token_endpoint: `${await Config.getApiUrl()}/oauth2/token`,
  };
  return {
    authority: config.authorityEndpoint,
    client_id: config.clientId,
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    metadata,
    prompt: 'consent login',
    scope: 'openid email profile',
    stateStore: new WebStorageStateStore({store: window.localStorage}),
    userStore: new WebStorageStateStore({store: window.localStorage}),
    automaticSilentRenew: true,
    // Time before access token expires when access token expiring event is fired
    accessTokenExpiringNotificationTimeInSeconds: 330,
    includeIdTokenInSilentRenew: true,
    extraQueryParams: {access_type: 'offline'},
    redirect_uri: '', // this field is not being used currently, but is expected from UserManager
  };
};

export const OidcBroker = {
  initialize: async (): Promise<void> => {
    config = await OAuth2.getConfig();
    userManagerSettings = await generateOidcUserManagerSettings(config);
    userManager = new UserManager(userManagerSettings);
  },
  getUserManager: (): UserManager => {
    if (userManager === null) {
      throw new Error('Cannot retrieve userManager before OidcBroker is initialized');
    }
    return userManager;
  },
  getUserManagerSettings: (): UserManagerSettings => {
    if (userManagerSettings === null) {
      throw new Error('Cannot retrieve userManagerSettings before OidcBroker is initialized');
    }
    return userManagerSettings;
  },
  signIn: async (args?: SigninPopupArgs): Promise<User | null> => {
    const um: UserManager = OidcBroker.getUserManager();
    return await um.signinPopup(args);
  },
  signOut: async (): Promise<void> => {
    const um: UserManager = OidcBroker.getUserManager();
    await um.removeUser();
    await um.clearStaleState();
  }
};
