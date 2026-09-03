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
import { resetSessionCache } from './session'
import { getCsrfToken, isCsrfRejection, resetCsrfToken } from './../ajax/csrf'
import { POST_LOGOUT_PATH, clearPostLogoutTarget, safeLocalPath, storePostLogoutTarget } from './postLogout'
import { showUnconfirmedSignOutNotice } from './signOutNotice'
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
  replace: (url: string): void => {
    globalThis.location.replace(url)
  },
  /**
   * A guaranteed reload of the current page. Assigning location.href to the
   * current URL does NOT reload when the URL carries a #fragment — the
   * browser treats it as a same-document navigation — so "reload in place"
   * must never go through Redirect.to.
   */
  reload: (): void => {
    globalThis.location.reload()
  },
}

/** An unconfirmed result performs no cleanup or navigation. */
export type SignOutResult = { status: 'confirmed' } | { status: 'unconfirmed' }

const CONFIRMED: SignOutResult = { status: 'confirmed' }
const UNCONFIRMED: SignOutResult = { status: 'unconfirmed' }

type LogoutReading
  = | { outcome: 'b2c', redirectUrl: string }
    | { outcome: 'local' }
    | { outcome: 'unconfirmed' }

// The server validates the B2C origin; the client can only validate structure.
const wellFormedRedirectUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  }
  catch {
    return false
  }
}

const readLogoutResponse = async (res: Response): Promise<LogoutReading> => {
  if (res.status === 204) return { outcome: 'local' }
  if (res.status !== 200) return { outcome: 'unconfirmed' }
  try {
    const body = await res.json() as { redirectUrl?: unknown }
    if (wellFormedRedirectUrl(body.redirectUrl)) {
      return { outcome: 'b2c', redirectUrl: body.redirectUrl }
    }
  }
  catch {}
  return { outcome: 'unconfirmed' }
}

const postLogout = async (): Promise<Response> =>
  fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': await getCsrfToken() },
  })

/** Posts logout with at most one retry for a stale CSRF token. */
const attemptLogout = async (): Promise<LogoutReading> => {
  try {
    let res = await postLogout()
    if (await isCsrfRejection(res)) {
      resetCsrfToken()
      res = await postLogout()
    }
    return await readLogoutResponse(res)
  }
  catch {
    return { outcome: 'unconfirmed' }
  }
}

type Verification = 'gone' | 'live' | 'unknown'

// Bypass the session cache when verifying the result of a logout.
const verifySession = async (): Promise<Verification> => {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' })
    if (res.status === 401) return 'gone'
    if (res.ok) return 'live'
    return 'unknown'
  }
  catch {
    return 'unknown'
  }
}

/** Clears browser state only after the server session is confirmed gone. */
const localCleanup = (): void => {
  resetCsrfToken()
  Storage.clearStorage()
  resetSessionCache()
  purgeLegacyOidcKeys()
}

const bffSignOut = async (redirectTo: string): Promise<SignOutResult> => {
  // B2C requires an exact post_logout_redirect_uri, so carry the local target separately.
  storePostLogoutTarget(redirectTo)

  let reading = await attemptLogout()
  if (reading.outcome === 'unconfirmed') {
    const verified = await verifySession()
    if (verified === 'gone') reading = { outcome: 'local' }
    else if (verified === 'live') reading = await attemptLogout()
  }

  if (reading.outcome === 'unconfirmed') {
    clearPostLogoutTarget()
    return UNCONFIRMED
  }

  localCleanup()
  Redirect.to(reading.outcome === 'b2c' ? reading.redirectUrl : POST_LOGOUT_PATH)
  return CONFIRMED
}

// Concurrent 401s share one attempt; clearing on settle allows a later retry.
let signOutInFlight: Promise<SignOutResult> | null = null

const coalescedBffSignOut = (redirectTo: string): Promise<SignOutResult> => {
  signOutInFlight ??= bffSignOut(redirectTo)
    .catch(() => {
      clearPostLogoutTarget()
      return UNCONFIRMED
    })
    .finally(() => {
      signOutInFlight = null
    })
  return signOutInFlight
}

const legacySignOut = async (redirectTo: string): Promise<SignOutResult> => {
  Storage.clearStorage()
  try {
    await OidcBroker.signOut()
  }
  catch {}
  Redirect.to(safeLocalPath(redirectTo))
  return CONFIRMED
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
      void Auth.signOut()
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
  /** Owns navigation and returns an outcome rather than rejecting. */
  signOut: async (redirectTo: string = '/'): Promise<SignOutResult> => {
    let bffEnabled: boolean
    try {
      bffEnabled = await Config.isBffEnabled()
    }
    catch {
      return UNCONFIRMED
    }
    if (bffEnabled) {
      return coalescedBffSignOut(safeLocalPath(redirectTo))
    }
    return legacySignOut(redirectTo)
  },
}

export const reportUnconfirmedSignOut = (): void => {
  showUnconfirmedSignOutNotice(() => {
    void redirectOnLogout()
  })
}

export const redirectOnLogout = async (): Promise<SignOutResult> => {
  // '/' and '/home' are landing pages, not destinations worth returning to
  // (the same rule SignInButton applies). A 401 can fire after the app has
  // already navigated home — an in-flight request racing a sign-out — and
  // must not produce a self-referential /home?redirectTo=/home.
  const path = globalThis.location.pathname
  const redirectTo = path === '/' || path === '/home' ? '/home' : `/home?redirectTo=${path}`
  const result = await Auth.signOut(redirectTo)
  if (result.status === 'unconfirmed') {
    reportUnconfirmedSignOut()
  }
  return result
}
