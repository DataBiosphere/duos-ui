/*
    DUOS-specific auth actions (signIn, signOut, etc.) against the BFF.

    The browser holds no tokens: sign-in is a full-page redirect to the B2C
    login page (which presents the Google/Microsoft choice), the OAuth code
    exchange happens server-side at /auth/callback, and the only client-side
    authentication artifact is the BFF session cookie.
*/
import { Storage } from './../storage'
import { Config } from './../config'
import { browserNavigation } from './../browserNavigation'
import { CSRF_HEADER, getCsrfToken, resetCsrfToken } from './csrf'
import { getSessionInfo, resetSessionCache } from './session'

/**
 * Destroys the BFF session and clears local storage. Best-effort on the
 * network leg: /auth/logout requires a CSRF token, and an expired session (the
 * redirectOnLogout path) may not be able to produce a useful one — local state
 * is cleared regardless, and the session cookie dies server-side on expiry.
 */
const endSession = async (): Promise<void> => {
  try {
    const token = await getCsrfToken()
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { [CSRF_HEADER]: token },
    })
  }
  catch {
    // Logout must complete client-side even when the BFF is unreachable.
  }
  Storage.clearStorage()
  resetCsrfToken()
  resetSessionCache()
}

export const Auth = {
  signInError: () => {
    return 'Unexpected error, please contact customer support.'
  },

  // Purge legacy oidc-client-ts localStorage keys once the environment has
  // cut over so pre-cutover tokens don't linger until natural expiry. Legacy
  // storage is deliberately untouched in non-cutover environments — see
  // epic 4-B: mutating it would break the legacy flow it keeps working.
  initialize: async (): Promise<void> => {
    if (await Config.isBffEnabled()) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('OidcUser') || k.startsWith('oidc.'))
        .forEach(k => localStorage.removeItem(k))
    }
  },

  /**
   * Starts the BFF login flow: the server generates PKCE parameters, stores
   * them in the session, and returns the B2C authorization URL for a
   * full-page redirect. No idp parameter — provider selection happens on the
   * B2C page. `returnTo` is the same-origin path to land on after the
   * server-side callback completes (validated server-side).
   */
  signIn: async (returnTo?: string): Promise<void> => {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
    const res = await fetch(`/auth/login${query}`, { method: 'POST', credentials: 'include' })
    if (!res.ok) {
      throw new Error(Auth.signInError())
    }
    const { redirectUrl } = await res.json() as { redirectUrl: string }
    // Auth state is about to change; cached CSRF/session state is stale.
    resetCsrfToken()
    resetSessionCache()
    browserNavigation.assign(redirectUrl)
  },

  signOut: async (): Promise<void> => {
    await endSession()
    browserNavigation.assign('/')
  },

  isAuthenticated: async (): Promise<boolean> => {
    return (await getSessionInfo()).authenticated
  },
}

export const redirectOnLogout = () => {
  const redirectTo = browserNavigation.currentPathname()
  // Ensure the logout POST isn't cancelled by the navigation.
  void endSession().finally(() => {
    browserNavigation.assign(`/home?redirectTo=${redirectTo}`)
  })
}
