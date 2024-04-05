/* 
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)
*/

import { AuthContextProps } from "react-oidc-context";
import { OidcBroker, OidcUser } from "./oidcBroker";
import { User, UserManagerSettings } from "oidc-client-ts";

const Auth = {
  getToken: () => {
    const settings: UserManagerSettings =
      OidcBroker.getOidcUserManagerSettings();
    const oidcStorage: string | null = localStorage.getItem(
      `oidc.user:${settings.authority}:${settings.client_id}`
    );
    return oidcStorage !== null ? User.fromStorageString(oidcStorage).access_token : "token";
  },

  signIn: async (
    authInstance: AuthContextProps,
    popup: boolean, //TODO: Implement signInSilent
    onSuccess?: (response: OidcUser) => Promise<void> | void,
    onFailure?: (response: any) => Promise<void> | void
  ) => {
    try {
      const user: OidcUser = await authInstance.signinPopup();
      onSuccess?.(user);
    } catch (err) {
      onFailure?.(err);
    }
  },

  //TODO: Implement signOut
  signOut: async () => {},
};

export default Auth;
