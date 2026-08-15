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
import { Auth } from 'src/libs/auth/auth'
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

export const completeSignIn = async ({ navigate, queryClient, redirectPath }: CompleteSignInOptions): Promise<void> => {
  // '/' and '/home' are landing pages, not destinations worth returning to —
  // signed-in users on those go to their console instead.
  const shouldRedirect = redirectPath !== '/' && redirectPath !== '/home'
  const redirectTo = shouldRedirect ? redirectPath : null

  // Check for ToS acceptance — redirect the user if not accepted yet. The
  // BFF /auth/callback redirect lands the browser on redirectPath itself, so
  // an accepted user with a destination usually stays put; the legacy popup
  // flow reloads on the sign-in page instead, so navigate when not there yet.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
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
      navigate(`/tos_acceptance?redirectTo=${redirectPath}`)
    }
  }

  const registerAndRedirectNewUser = async () => {
    const registeredUser: DuosUser = await User.registerUser()
    const redirectParam = redirectTo ? `?redirectTo=${redirectTo}` : ''
    setUserRoleStatuses(registeredUser, Storage)
    // New identity — same cache reset as the normal sign-in path below.
    queryClient.clear()
    syncSignInOrRegistrationEvent(eventList.userRegister)
    navigate(`/tos_acceptance${redirectParam}`)
  }

  const handleRegistration = async () => {
    try {
      await registerAndRedirectNewUser()
    }
    catch (error) {
      if (errorStatus(error) === 409) {
        // Already registered (raced by another tab, or the earlier getMe
        // failed transiently) — complete as a normal sign-in from a fresh
        // user fetch. Routing off whatever CurrentUser happens to be in
        // storage (usually the empty default) would send an accepted user
        // back to the ToS gate without the cache reset or sign-in metric.
        try {
          await completeExistingUserSignIn(await User.getMe())
        }
        catch {
          await Auth.signOut()
        }
      }
      else {
        Notifications.showError({
          text: 'Error during sign in: ' + extractError(error),
          description: 'There was an error completing your registration. Please try again.',
        })
        // Authenticated but unregistered and unregisterable: resolving here
        // would let App mark the bootstrap done and unlock the routes with an
        // empty CurrentUser. Destroy the session instead — the reload lands
        // the user cleanly signed out, and signing in again retries.
        await Auth.signOut()
      }
    }
  }

  const completeExistingUserSignIn = async (duosUser: DuosUser): Promise<void> => {
    Storage.setCurrentUser(duosUser)
    setUserRoleStatuses(duosUser, Storage)
    // Drop any query results cached before sign-in: cached library queries
    // (data, tab counts, filter metadata) were built with the anonymous /
    // previous user's role-based visibility clauses and would otherwise be
    // served from cache under the new user's identity.
    queryClient.clear()
    if (!duosUser.roles) {
      await ErrorReporter.report('roles not found for user: ' + duosUser.email)
    }
    syncSignInOrRegistrationEvent(eventList.userSignIn)
    await checkToSAndRedirect(redirectTo)
  }

  try {
    const duosUser: DuosUser = await User.getMe()
    if (duosUser) {
      await completeExistingUserSignIn(duosUser)
    }
    else {
      await handleRegistration()
    }
  }
  catch (error) {
    // Explicitly handle AzureB2C errors from Sam
    const errorMessage = extractError(error)
    if (errorMessage.toLowerCase().includes('azureb2c authentication error')) {
      Notifications.showError({ text: errorMessage })
      await Auth.signOut()
    }
    else {
      await handleRegistration()
    }
  }
}
