import {
  IdTokenClaims,
  OidcMetadata,
  SigninPopupArgs,
  SigninSilentArgs,
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

type OidcUserManager = UserManager;

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
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`,
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
  getUser: async (): Promise<OidcUser | null> => {
    const userManager: OidcUserManager = new UserManager(OidcBroker.getUserManagerSettings());
    return await userManager.getUser();
  },
  getUserSync: (): OidcUser | null => {
    const settings: UserManagerSettings =
        OidcBroker.getUserManagerSettings();
    const oidcStorage: string | null = localStorage.getItem(
      `oidc.user:${settings.authority}:${settings.client_id}`
    );
    return oidcStorage !== null ? User.fromStorageString(oidcStorage) : null;
  },
  signIn: async (popup: boolean, args?: SigninPopupArgs | SigninSilentArgs): Promise<User | null> => {
    const um: UserManager = OidcBroker.getUserManager();
    return popup ? await um.signinPopup(args) : await um.signinSilent(args);
  },
  signOut: async (): Promise<void> => {
    const um: UserManager = OidcBroker.getUserManager();
    await um.removeUser();
    await um.clearStaleState();
  }
};
