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
  /**
   * Replaces the current history entry. /post-logout uses this so the B2C
   * round-trip does not sit in the back history, where Back would return the
   * user to a logout hand-off page with its target already consumed.
   */
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

/**
 * How a sign-out ended (BFF Phase 5, story 5-E).
 *
 * 'confirmed': the BFF session is gone (the server said so, or the /auth/me
 * probe proved it), local cleanup ran, and Auth.signOut navigated away.
 * 'unconfirmed': the client does NOT know whether the session survived — no
 * cleanup ran, no navigation happened, and the caller must report it.
 *
 * A value, not an exception: the fetch adapter invokes redirectOnLogout()
 * without awaiting it, so a rejected promise would surface as an unhandled
 * rejection. Auth.signOut never rejects.
 */
export type SignOutResult = { status: 'confirmed' } | { status: 'unconfirmed' }

const CONFIRMED: SignOutResult = { status: 'confirmed' }
const UNCONFIRMED: SignOutResult = { status: 'unconfirmed' }

/**
 * How the logout response reads. ONE contract, and only two answers confirm
 * anything: 200 with a well-formed redirectUrl (end the B2C session too), or
 * 204 (the BFF destroyed the session and arranged no single sign-out).
 * Everything else — malformed JSON, a 200 without a redirectUrl, a final 403,
 * a 429, a 500, a transport failure — is unconfirmed.
 */
type LogoutReading
  = | { outcome: 'b2c', redirectUrl: string }
    | { outcome: 'local' }
    | { outcome: 'unconfirmed' }

/**
 * Structural check only. The B2C origin is server-only configuration —
 * config.json does not carry it — so the client cannot validate the origin.
 * The server is the trust boundary: it builds the URL from its configured
 * discovery document and requires HTTPS outside development, and this response
 * came from the app's own same-origin logout endpoint.
 */
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
  catch {
    // Unparseable 200 body.
  }
  // The server's contract is that a 200 always carries a redirectUrl, so a 200
  // without one is an anomaly — NOT a signal that the session was destroyed.
  return { outcome: 'unconfirmed' }
}

const postLogout = async (): Promise<Response> =>
  fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': await getCsrfToken() },
  })

/**
 * One bounded logout attempt: POST, one CSRF retry, then classify.
 *
 * The retry must yield the FINAL response — a cached token can be stale
 * (session rotation at login discards the old secret), and reading the first
 * 403 instead of the retry's answer would skip the B2C navigation on exactly
 * the path the retry exists for.
 */
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
    // A transport failure, or /auth/csrf-token answering 401 because the
    // session is already gone. Nothing is confirmed from here — the caller
    // verifies against /auth/me.
    return { outcome: 'unconfirmed' }
  }
}

/** What /auth/me says about the session an unconfirmed logout left behind. */
type Verification = 'gone' | 'live' | 'unknown'

/**
 * Deliberately fetches /auth/me directly rather than through getSessionInfo:
 * that helper caches, holds the last authoritative answer across transient
 * failures, and would serve the pre-logout "authenticated" reply — none of
 * which can settle what just happened to this session.
 */
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

/**
 * Everything the browser must forget. Runs ONLY on a confirmed sign-out: after
 * an unconfirmed one the session cookie may still be live, and the reconciler
 * (GET /auth/me on every load) would rehydrate the identity on the next page
 * even though local storage was cleared.
 */
const localCleanup = (): void => {
  // The session (and with it the server-side CSRF secret) is gone — any cached token is stale.
  resetCsrfToken()
  Storage.clearStorage()
  // The probe cache still holds the pre-logout "authenticated" answer; a
  // re-render before the navigation unloads the page must not paint a
  // signed-in header around the just-cleared (empty) stored user.
  resetSessionCache()
  purgeLegacyOidcKeys()
}

/**
 * The BFF sign-out. Owns its navigation in every confirmed case; on an
 * unconfirmed one it stays on the page and reports.
 */
const bffSignOut = async (redirectTo: string): Promise<SignOutResult> => {
  // Stored BEFORE the logout: /post-logout is reached through B2C, whose
  // post_logout_redirect_uri must match a registered URI exactly, so the local
  // target cannot ride in the URI itself.
  storePostLogoutTarget(redirectTo)

  let reading = await attemptLogout()
  if (reading.outcome === 'unconfirmed') {
    // Verify instead of assuming: a network failure is not a 204.
    const verified = await verifySession()
    if (verified === 'gone') reading = { outcome: 'local' }
    // Still authenticated — the logout never landed. Retry once (bounded: a
    // second unconfirmed reading ends the flow rather than looping).
    else if (verified === 'live') reading = await attemptLogout()
  }

  if (reading.outcome === 'unconfirmed') {
    clearPostLogoutTarget()
    return UNCONFIRMED
  }

  localCleanup()
  // Cleanup runs BEFORE the navigation away, in both confirmed cases.
  Redirect.to(reading.outcome === 'b2c' ? reading.redirectUrl : POST_LOGOUT_PATH)
  return CONFIRMED
}

/**
 * Several concurrent API 401s can each invoke redirectOnLogout(), so all
 * concurrent callers share ONE attempt — otherwise one call could obtain the
 * B2C URL while another raced through a missing-session CSRF failure. The
 * first caller's validated target wins. The promise is cleared once the
 * attempt settles — especially on 'unconfirmed', so Retry starts a fresh
 * attempt instead of re-awaiting the failed one.
 */
let signOutInFlight: Promise<SignOutResult> | null = null

const coalescedBffSignOut = (redirectTo: string): Promise<SignOutResult> => {
  signOutInFlight ??= bffSignOut(redirectTo)
    .catch(() => UNCONFIRMED)
    .finally(() => {
      signOutInFlight = null
    })
  return signOutInFlight
}

/** Legacy sign-out: clear state, finish the broker, navigate. */
const legacySignOut = async (redirectTo: string): Promise<SignOutResult> => {
  Storage.clearStorage()
  try {
    await OidcBroker.signOut()
  }
  catch {
    // The broker only removes its own local tokens — storage is already
    // cleared, and the navigation below must still happen.
  }
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
  /**
   * Signs the user out and OWNS the navigation in both modes — callers perform
   * none. A caller that navigated alongside this call would unload the page
   * and abort the CSRF fetch, the logout POST, the /auth/me verification, or
   * the B2C end-session navigation.
   *
   * Never rejects: it returns a discriminated result instead, and the caller
   * reports an unconfirmed sign-out (see reportUnconfirmedSignOut).
   */
  signOut: async (redirectTo: string = '/'): Promise<SignOutResult> => {
    let bffEnabled: boolean
    try {
      bffEnabled = await Config.isBffEnabled()
    }
    catch {
      // Without config neither flow can run — claim nothing, clean up nothing.
      return UNCONFIRMED
    }
    if (bffEnabled) {
      return coalescedBffSignOut(safeLocalPath(redirectTo))
    }
    return legacySignOut(redirectTo)
  },
}

/**
 * Dispatches the global, persistent "sign-out could not be confirmed" notice,
 * whose Retry starts a fresh sign-out attempt. Exported for the non-UI callers
 * that must own a notice of their own (postSignIn's bootstrap failures).
 */
export const reportUnconfirmedSignOut = (): void => {
  showUnconfirmedSignOutNotice(() => {
    void redirectOnLogout()
  })
}

/**
 * The automatic sign-out for a terminal 401 (the proxy already destroyed the
 * session). It consumes Auth.signOut's promise and result: this caller is the
 * fetch adapter, not a component, so a discarded result would silently leave
 * the user on the page believing they signed out.
 *
 * It performs NO navigation of its own — Auth.signOut owns that.
 *
 * The B2C leg is impossible here by construction (the session's idToken died
 * with the session row, and /auth/csrf-token is gated on authentication), so
 * this path resolves through the normal classification: the logout attempt is
 * unconfirmed, the /auth/me probe answers 401, and that is a confirmed LOCAL
 * logout. Acceptable because prompt: 'login' at sign-in forces the B2C login
 * screen regardless of B2C's own cookie.
 */
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
