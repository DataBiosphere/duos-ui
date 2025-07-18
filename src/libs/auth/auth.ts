/*
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)
*/
import {OidcBroker, OidcUser} from './oidcBroker';
import {Storage} from './../storage';
import {UserManager} from 'oidc-client-ts';
import {MetricsEventName} from '../events';

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
    return user;
  },
  signOut: async () => {
    Storage.clearStorage();
    await OidcBroker.signOut();
  },
};

// extending Window interface to access Appcues
declare global {
  interface Window {
    Appcues?: {
      /** Identifies the current user with an ID and an optional set of properties. */
      identify: (userId: string, properties?: any) => void;
      /** Notifies the SDK that the state of the application has changed. */
      page: () => void;
      /** Forces specific Appcues content to appear for the current user by passing in the ID. */
      show: (contentId: string) => void;
      /** Fire the callback function when the given event is triggered by the SDK */
      on: ((eventName: Exclude<string, 'all'>, callbackFn: (event: any) => void | Promise<void>) => void) &
          ((eventName: 'all', callbackFn: (eventName: string, event: any) => void | Promise<void>) => void);
      /** Clears all known information about the current user in this session */
      reset: () => void;
      /** Tracks a custom event (by name) taken by the current user. */
      track: (eventName: MetricsEventName) => void;
    };
    forceSignIn: any;
  }
}
