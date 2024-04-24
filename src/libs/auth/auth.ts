/* 
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)
*/

import { OidcBroker, OidcUser } from './oidcBroker';
import { Storage } from './../storage';
import { UserManager } from 'oidc-client-ts';

export const Auth = {
  getToken: (): string => {
    // In a future ticket, it would be better to make get Token an async function and call
    // the UserManager.getUser to get the token. Since authOpts depends on getToken being synchonous
    // it would be alot of places to change the uses of authOpts.
    const oidcUser: OidcUser | null = OidcBroker.getUserSync();
    return oidcUser !== null ? oidcUser.access_token : 'token';
  },
  initialize: async (): Promise<void> => {
    await OidcBroker.initialize();
    const oidcUser: OidcUser | null = await OidcBroker.getUser();
    const um: UserManager = OidcBroker.getUserManager();
    // UserManager events.
    // For details of each event, see https://authts.github.io/oidc-client-ts/classes/UserManagerEvents.html
    um.events.addUserLoaded((user: OidcUser) => {
      //TODO: DUOS-3072 Add metrics for user loaded
    });
    um.events.addAccessTokenExpiring((): void => {
      //TODO: DUOS-3082 Add an alert that session will expire soon
    });
    um.events.addAccessTokenExpired((): void => {
      Auth.signOut();
      //TODO: DUOS-3082 Add an alert that session has expired
    });
    if (oidcUser !== null) {
      Storage.setUserIsLogged(true);
    } else {
      await Auth.signOut();
    }
  },

  signIn: async (popup: boolean): Promise<OidcUser> => {
    const user: OidcUser | null = await OidcBroker.signIn(popup);
    if (user === null) {
      throw new Error('signInSilent called before signInPopup');
    }
    Storage.setUserIsLogged(true);
    return user;
  },

  signOut: async () => {
    Storage.clearStorage();
    Storage.setUserIsLogged(false);
    await OidcBroker.signOut();
  },
};
