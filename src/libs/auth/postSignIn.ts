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
}

const errorStatus = (error: unknown): number | undefined => {
  const e = error as HttpishError
  return e.response?.status ?? e.status
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

  // Check for ToS acceptance — redirect the user if not accepted yet. Unlike
  // the old popup flow, the /auth/callback redirect already landed the browser
  // on redirectPath, so an accepted user with a destination stays put.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    const tosAccepted = Storage.getCurrentUser().userStatusInfo?.tosAccepted || false
    if (tosAccepted) {
      if (redirectPath === null) {
        await Navigation.console(Storage.getCurrentUser(), navigate)
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
      switch (errorStatus(error)) {
        case 409:
          // Already registered — treat like a normal sign-in.
          try {
            await checkToSAndRedirect(redirectTo)
          }
          catch {
            await Auth.signOut()
          }
          break
        default:
          Notifications.showError({
            text: 'Error during sign in: ' + extractError(error),
            description: 'There was an error completing your registration. Please try again.',
          })
          break
      }
    }
  }

  try {
    const duosUser: DuosUser = await User.getMe()
    if (duosUser) {
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
