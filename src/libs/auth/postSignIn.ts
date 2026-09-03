/**
 * Post-sign-in bootstrap.
 *
 * With the BFF, sign-in is a full-page redirect: the browser leaves for B2C,
 * returns via the server-side /auth/callback, and lands back on the app with a
 * session cookie but no local user state. This module is the code that used to
 * run in SignInButton's popup onSuccess handler — fetch (or register) the DUOS
 * user, persist it, fire the sign-in metrics, and route through the ToS gate.
 * App.tsx runs it once whenever a session exists but CurrentUser is empty.
 */
import type { NavigateFunction } from 'react-router'
import type { QueryClient } from '@tanstack/react-query'
import { User } from 'src/libs/ajax/User'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { Auth, reportUnconfirmedSignOut } from 'src/libs/auth/auth'
import { resetSessionCache } from 'src/libs/auth/session'
import { Navigation, Notifications, setUserRoleStatuses } from 'src/libs/utils'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import eventList, { MetricsEventName } from 'src/libs/events'
import { extractError } from 'src/utils/ErrorUtils'
import { DuosUser } from 'src/types/model'

export interface CompleteSignInOptions {
  navigate: NavigateFunction
  queryClient: QueryClient
  /** The path the /auth/callback redirect landed on (location.pathname). */
  redirectPath: string
  /**
   * Polled before every side-effecting step. When a newer reconciliation has
   * superseded this run, it must not persist a user, clear caches, emit
   * metrics, navigate, or sign out — the newer run owns the session now.
   */
  isCancelled?: () => boolean
  /**
   * The freshest same-user profile a probe delivered while this run was in
   * flight (the reconciler's joined-probe hydration). Consulted at persist
   * and routing time so an older getMe response does not route off outdated
   * roles/ToS state.
   */
  latestJoinedProfile?: () => DuosUser | undefined
  /**
   * True when the session probe that triggered this run reported an
   * authenticated session with no DUOS profile — /auth/me's "valid session,
   * unregistered user" answer. The initial getMe is skipped: the probe fetched
   * /api/user/me moments ago, and repeating the call through /duos-api hits
   * the same upstream 401 that the proxy treats as an authoritative token
   * rejection (destroySessionOnUpstream401) — destroying the session that
   * registerUser() is about to need. A stale no-profile answer (the user
   * registered in another tab meanwhile) is recovered by the 409 branch.
   */
  sessionReportsNoProfile?: boolean
}

/**
 * How the run ended. The caller applies follow-up work (e.g. joined-probe
 * hydration) only on 'completed' — a 'signed-out' run has just cleared
 * storage, and re-populating it would resurrect a stale identity that
 * survives the sign-out reload.
 * `sign-out-unconfirmed` leaves the session state unknown.
 */
export type CompleteSignInOutcome = 'completed' | 'signed-out' | 'sign-out-unconfirmed' | 'cancelled'

const signOutAfterBootstrapFailure = async (): Promise<CompleteSignInOutcome> => {
  const result = await Auth.signOut()
  if (result.status === 'confirmed') return 'signed-out'
  reportUnconfirmedSignOut()
  return 'sign-out-unconfirmed'
}

interface HttpishError {
  status?: number
  response?: { status?: number, data?: { message?: string } }
  cause?: unknown
}

/**
 * fetchAdapter throws the axios-like { response: { status } } error wrapped
 * inside Error.cause (its outer catch re-wraps everything it didn't itself
 * construct), so the HTTP status must be dug out of the cause chain.
 */
const errorStatus = (error: unknown): number | undefined => {
  let e = error as HttpishError | undefined
  while (e) {
    const status = e.response?.status ?? e.status
    if (status !== undefined) return status
    e = e.cause as HttpishError | undefined
  }
  return undefined
}

const syncSignInOrRegistrationEvent = (event: MetricsEventName) => {
  Storage.setAnonymousId()
  // noinspection ES6MissingAwait,JSIgnoredPromiseFromCall
  Metrics.identify(`${Storage.getAnonymousId()}`)
  // noinspection ES6MissingAwait,JSIgnoredPromiseFromCall
  Metrics.syncProfile()
  // noinspection ES6MissingAwait,JSIgnoredPromiseFromCall
  Metrics.captureEvent(event)
}

export const completeSignIn = async ({ navigate, queryClient, redirectPath, isCancelled, latestJoinedProfile, sessionReportsNoProfile }: CompleteSignInOptions): Promise<CompleteSignInOutcome> => {
  const cancelled = () => isCancelled?.() === true
  // '/' and '/home' are landing pages, not destinations worth returning to —
  // signed-in users on those go to their console instead.
  const shouldRedirect = redirectPath !== '/' && redirectPath !== '/home'
  const redirectTo = shouldRedirect ? redirectPath : null

  // Check for ToS acceptance — redirect the user if not accepted yet. The
  // BFF /auth/callback redirect lands the browser on redirectPath itself, so
  // an accepted user with a destination usually stays put; the legacy popup
  // flow reloads on the sign-in page instead, so navigate when not there yet.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    if (cancelled()) return
    const tosAccepted = Storage.getCurrentUser().userStatusInfo?.tosAccepted || false
    if (tosAccepted) {
      if (redirectPath === null) {
        await Navigation.console(Storage.getCurrentUser(), navigate)
      }
      else if (globalThis.location.pathname !== redirectPath) {
        navigate(redirectPath)
      }
    }
    else if (redirectPath === null) {
      navigate('/tos_acceptance')
    }
    else {
      // Encoded, or a destination with its own query string ('?filter=a&b=c')
      // splits at the first '&' and its tail becomes sibling params of the
      // ToS page. The readers decode via URLSearchParams.
      navigate(`/tos_acceptance?redirectTo=${encodeURIComponent(redirectPath)}`)
    }
  }

  const registerAndRedirectNewUser = async (): Promise<CompleteSignInOutcome> => {
    const registeredUser: DuosUser = await User.registerUser()
    if (cancelled()) return 'cancelled'
    // Encoded for the same reason as checkToSAndRedirect above.
    const redirectParam = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''
    setUserRoleStatuses(registeredUser, Storage)
    // New identity — same cache reset as the normal sign-in path below. The
    // cached /auth/me answer predates the registration (authenticated, no
    // user), so drop it too: the navigation below re-probes and picks up the
    // newly registered identity.
    queryClient.clear()
    resetSessionCache()
    syncSignInOrRegistrationEvent(eventList.userRegister)
    navigate(`/tos_acceptance${redirectParam}`)
    return 'completed'
  }

  const handleRegistration = async (): Promise<CompleteSignInOutcome> => {
    try {
      return await registerAndRedirectNewUser()
    }
    catch (error) {
      if (errorStatus(error) === 409) {
        // Already registered (raced by another tab, or the earlier getMe
        // failed transiently) — complete as a normal sign-in from a fresh
        // user fetch. Routing off whatever CurrentUser happens to be in
        // storage (usually the empty default) would send an accepted user
        // back to the ToS gate without the cache reset or sign-in metric.
        try {
          return await completeExistingUserSignIn(await User.getMe())
        }
        catch {
          if (cancelled()) return 'cancelled'
          return await signOutAfterBootstrapFailure()
        }
      }
      if (cancelled()) return 'cancelled'
      Notifications.showError({
        text: 'Error during sign in: ' + extractError(error),
        description: 'There was an error completing your registration. Please try again.',
      })
      // Authenticated but unregistered and unregisterable: resolving here
      // would let App mark the bootstrap done and unlock the routes with an
      // empty CurrentUser. Destroy the session instead — the reload lands
      // the user cleanly signed out, and signing in again retries.
      return await signOutAfterBootstrapFailure()
    }
  }

  const completeExistingUserSignIn = async (duosUser: DuosUser): Promise<CompleteSignInOutcome> => {
    if (cancelled()) return 'cancelled'
    // Prefer the freshest same-user profile a joined probe delivered while
    // this run's getMe was in flight — persisting and routing off the older
    // response could apply outdated roles or ToS state.
    const resolveEffectiveUser = (base: DuosUser): DuosUser => {
      const joined = latestJoinedProfile?.()
      if (joined === undefined) return base
      return joined.userId === base.userId ? joined : base
    }
    let effectiveUser = resolveEffectiveUser(duosUser)
    // setUserRoleStatuses persists the user itself (utils.ts) — no separate
    // Storage.setCurrentUser call.
    setUserRoleStatuses(effectiveUser, Storage)
    // Drop any query results cached before sign-in: cached library queries
    // (data, tab counts, filter metadata) were built with the anonymous /
    // previous user's role-based visibility clauses and would otherwise be
    // served from cache under the new user's identity. The session cache can
    // likewise predate this identity (the 409 path arrives here with an
    // authenticated-no-user probe answer cached).
    queryClient.clear()
    resetSessionCache()
    if (!effectiveUser.roles) {
      await ErrorReporter.report('roles not found for user: ' + effectiveUser.email)
      // The report awaits env lookup + delivery — long enough to be superseded…
      if (cancelled()) return 'cancelled'
      // …or for a fresher profile to join. Resample before metrics and
      // routing: checkToSAndRedirect reads storage, and routing off the
      // pre-report profile could send an accepted user to the ToS gate — a
      // navigation the reconciler's post-completion apply cannot repair.
      const resampled = resolveEffectiveUser(effectiveUser)
      if (resampled !== effectiveUser) {
        effectiveUser = resampled
        setUserRoleStatuses(effectiveUser, Storage)
      }
    }
    syncSignInOrRegistrationEvent(eventList.userSignIn)
    await checkToSAndRedirect(redirectTo)
    return cancelled() ? 'cancelled' : 'completed'
  }

  // The probe already answered "authenticated, no profile" — registration is
  // the only next step, and the getMe below must not run first (it would
  // destroy the session; see sessionReportsNoProfile).
  if (sessionReportsNoProfile) {
    return await handleRegistration()
  }

  try {
    const duosUser: DuosUser = await User.getMe()
    if (duosUser) {
      return await completeExistingUserSignIn(duosUser)
    }
    return await handleRegistration()
  }
  catch (error) {
    if (cancelled()) return 'cancelled'
    const errorMessage = extractError(error)
    // A 409 from getMe is the Sam sub-provider conflict the account lives under the other provider,
    // so registration cannot succeed — surface the actionable message instead of attempting it.
    if (errorStatus(error) === 409 || errorMessage.toLowerCase().includes('azureb2c authentication error')) {
      // Long timeout: the message carries instructions and a support link.
      Notifications.showError({ text: errorMessage, timeout: 30000 })
      return await signOutAfterBootstrapFailure()
    }
    return await handleRegistration()
  }
}
