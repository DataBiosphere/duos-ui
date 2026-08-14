/*
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)

    Two flows coexist behind Config.isBffEnabled() (BFF migration, Phase 4):
    - BFF (bffEnabled true in config.json): the server owns the authentication and proxy flow.
    - Legacy (default): the oidc-client-ts popup flow with tokens in localStorage.
*/
import { OidcBroker, OidcUser } from './oidcBroker'
import { Storage } from './../storage'
import { Config } from './../config'
import { getCsrfToken, isCsrfRejection, resetCsrfToken } from './../ajax/csrf'
import { UserManager } from 'oidc-client-ts'

const purgeLegacyOidcKeys = (): void => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('OidcUser') || key.startsWith('oidc.'))
    .forEach(key => localStorage.removeItem(key))
}

// Full-page navigations go through this Redirect
export const Redirect = {
  to: (url: string): void => {
    globalThis.location.href = url
  },
}

export const Auth = {
  signInError: () => {
    return 'Unexpected error, please contact customer support.'
  },
  initialize: async (): Promise<void> => {
    if (await Config.isBffEnabled()) {
      purgeLegacyOidcKeys()
      return
    }
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
  signIn: async (returnTo?: string): Promise<OidcUser> => {
    if (await Config.isBffEnabled()) {
      const url = returnTo
        ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
        : '/auth/login'
      const res = await fetch(url, { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        throw new Error(Auth.signInError())
      }
      const { redirectUrl } = await res.json() as { redirectUrl: string }
      Redirect.to(redirectUrl)
      // Full-page redirect: the app is navigating away, so this promise
      // intentionally never settles — callers expecting the legacy OidcUser
      // must not observe a user-less "success".
      return new Promise<OidcUser>(() => {})
    }
    const user: OidcUser | null = await OidcBroker.signIn()
    if (user === null) {
      throw new Error(Auth.signInError())
    }
    Storage.setOidcUser(user)
    return user
  },
  signOut: async (redirectTo: string = '/'): Promise<void> => {
    if (await Config.isBffEnabled()) {
      // POST /auth/logout is CSRF-guarded, so fetch a token first.
      try {
        const postLogout = async (): Promise<Response> =>
          fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'X-CSRF-Token': await getCsrfToken() },
          })
        const res = await postLogout()
        // A cached token can be stale (session rotation at login discards the
        // old secret) — refetch once and retry, or the logout silently fails
        // and the server session survives the local cleanup below.
        if (await isCsrfRejection(res)) {
          resetCsrfToken()
          await postLogout()
        }
        // Any other failure is a server-side problem the client can't act on;
        // fall through to the local cleanup either way.
      }
      catch {
        // Session destruction is server-side state; local cleanup still applies.
      }
      // The session (and with it the server-side CSRF secret) is gone — any cached token is stale.
      resetCsrfToken()
      Storage.clearStorage()
      purgeLegacyOidcKeys()
      Redirect.to(redirectTo)
      return
    }
    Storage.clearStorage()
    await OidcBroker.signOut()
  },
  isAuthenticated: async (): Promise<boolean> => {
    if (await Config.isBffEnabled()) {
      const res = await fetch('/auth/me', { credentials: 'include' })
      return res.ok
    }
    return Storage.userIsLogged()
  },
}

export const redirectOnLogout = () => {
  const redirectTo = `/home?redirectTo=${globalThis.location.pathname}`
  void Auth.signOut(redirectTo)
  Redirect.to(redirectTo)
}
