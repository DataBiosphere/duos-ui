import { IdTokenClaims, OidcMetadata, User, UserManager, UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';
import { Config } from '../config';
import { OAuth2, OAuthConfig } from '../ajax/OAuth2';

// Our config for b2C claims are defined here: https://github.com/broadinstitute/terraform-ap-deployments/tree/master/azure/b2c/policies
// The standard b2C claims are defined here: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-token-claims-reference
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
  initialize: async (): Promise<void> => {
    config = await OAuth2.getConfig();
    const ums: UserManagerSettings = await generateOidcUserManagerSettings(
      config
    );
    userManagerSettings = ums;
  },
  getOidcUserManagerSettings: (): UserManagerSettings => userManagerSettings!,
  getOidcUser: async (): Promise<OidcUser | null> => {
    const userManager: OidcUserManager = new UserManager(OidcBroker.getOidcUserManagerSettings());
    return await userManager.getUser();
  }
};
