/*
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)
*/
import { OidcBroker, OidcUser } from './oidcBroker'
import { Storage } from './../storage'
import { UserManager } from 'oidc-client-ts'

export const Auth = {
  signInError: () => {
    return 'Unexpected error, please contact customer support.'
  },
  initialize: async (): Promise<void> => {
    await OidcBroker.initialize()
    const um: UserManager = OidcBroker.getUserManager()
    // UserManager events.
    // For details of each event, see https://authts.github.io/oidc-client-ts/classes/UserManagerEvents.html
    um.events.addUserLoaded((_: OidcUser) => {
      // TODO: DUOS-3072 Add metrics for user loaded
    })
    um.events.addAccessTokenExpiring((): void => {
      // TODO: DUOS-3082 Add an alert that session will expire soon
    })
    um.events.addAccessTokenExpired((): void => {
      Auth.signOut()
      // TODO: DUOS-3082 Add an alert that session has expired
    })
  },
  signIn: async (): Promise<OidcUser> => {
    const user: OidcUser | null = await OidcBroker.signIn()
    if (user === null) {
      throw new Error(Auth.signInError())
    }
    Storage.setOidcUser(user)
    return user
  },
  signOut: async () => {
    Storage.clearStorage()
    await OidcBroker.signOut()
  },
}

// to log out user and redirect to home when response has 401 status
// return responses with statuses in the 200s and reject the rest
export const redirectOnLogout = () => {
  Auth.signOut()
  window.location.href = `/home?redirectTo=${window.location.pathname}`
}
