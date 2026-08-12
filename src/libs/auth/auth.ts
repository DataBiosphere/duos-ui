/*
    This file should abstract out the oidcBroker actions
    and implement DUOS specific auth login (signIn, signOut, etc.)

    Two flows coexist behind Config.isBffEnabled() (BFF migration, Phase 4):
    - BFF (bffEnabled true in config.json): the server owns the authentication
      and proxy flow.
    - Legacy (default): the oidc-client-ts popup flow with tokens in
      localStorage, unchanged until the environment cuts over (Phase 6).
*/
import { OidcBroker, OidcUser } from './oidcBroker'
import { Storage } from './../storage'
import { Config } from './../config'
import { UserManager } from 'oidc-client-ts'

// Legacy oidc-client-ts artifacts: Storage's 'OidcUser' record and the
// library's own 'oidc.*' entries (the localStorage-backed stateStore and
// userStore configured in oidcBroker.ts).
const purgeLegacyOidcKeys = (): void => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('OidcUser') || key.startsWith('oidc.'))
    .forEach(key => localStorage.removeItem(key))
}

// Full-page navigations go through this object rather than assigning
// globalThis.location.href inline: jsdom's window.location is
// [LegacyUnforgeable] and cannot be stubbed, so this is the seam tests use to
// observe redirect targets.
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
      // The server generates the PKCE parameters, stores them in the session,
      // and returns the B2C authorization URL; returnTo is validated
      // server-side and replayed after the /auth/callback leg.
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
      // POST /auth/logout is CSRF-guarded, so fetch a token first. Both calls
      // are best-effort: the common path here is a session that already
      // expired server-side, and a failure must not block the local cleanup
      // and redirect below.
      try {
        const csrfRes = await fetch('/auth/csrf-token', { credentials: 'include' })
        const { token } = await csrfRes.json() as { token: string }
        await fetch('/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRF-Token': token },
        })
      }
      catch {
        // Session destruction is server-side state; local cleanup still applies.
      }
      Storage.clearStorage()
      // clearStorage re-seeds a placeholder OidcUser record for legacy
      // readers; under the BFF no OidcUser key should exist at all.
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
    // Legacy fallback keeps call sites mode-agnostic; storage.ts's sync
    // userIsLogged is replaced by the async BFF version in story 4-E.
    return Storage.userIsLogged()
  },
}

export const redirectOnLogout = () => {
  const redirectTo = `/home?redirectTo=${globalThis.location.pathname}`
  void Auth.signOut(redirectTo)
  Redirect.to(redirectTo)
}
