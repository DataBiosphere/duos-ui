/*
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)
*/
import {OidcBroker, OidcUser} from './oidcBroker';
import {Storage} from './../storage';
import {UserManager} from 'oidc-client-ts';

export const Auth = {
  signInError: () => {
    return 'Unexpected error, please contact customer support.';
  },
  initialize: async (): Promise<void> => {
    await OidcBroker.initialize();
    const um: UserManager = OidcBroker.getUserManager();
    // UserManager events.
    // For details of each event, see https://authts.github.io/oidc-client-ts/classes/UserManagerEvents.html
    // eslint-disable-next-line no-unused-vars
    um.events.addUserLoaded((_: OidcUser) => {
      //TODO: DUOS-3072 Add metrics for user loaded
    });
    um.events.addAccessTokenExpiring((): void => {
      //TODO: DUOS-3082 Add an alert that session will expire soon
    });
    um.events.addAccessTokenExpired((): void => {
      Auth.signOut();
      //TODO: DUOS-3082 Add an alert that session has expired
    });
  },
  signIn: async (): Promise<OidcUser> => {
    const user: OidcUser | null = await OidcBroker.signIn();
    if (user === null) {
      throw new Error(Auth.signInError());
    }
    Storage.setOidcUser(user);
    Storage.setUserIsLogged(true);
    return user;
  },
  signOut: async () => {
    Storage.clearStorage();
    Storage.setUserIsLogged(false);
    await OidcBroker.signOut();
  },
};
