import { getDefaultProperties } from '@databiosphere/bard-client'

import { Storage } from 'src/libs/storage'
import { Config, Token } from 'src/libs/config'
import { MetricsEventName } from 'src/libs/events'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'

// Set default timeout for all metrics calls to 30 seconds
const defaultSignal: AbortSignal = AbortSignal.timeout(30000)

export const Metrics = {
  captureEvent: (
    event: MetricsEventName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: Record<string, any> = {},
    signal: AbortSignal = defaultSignal,
  ) => captureEventFn(event, signal, details).catch(() => {
  }),
  syncProfile: (signal: AbortSignal = defaultSignal) => syncProfile(signal),
  identify: (anonId: string, signal: AbortSignal = defaultSignal) => identify(anonId, signal),
}

/**
 * Captures an event with its details.
 *
 * @param {string} event - The event name.
 * @param {AbortSignal} [signal] - The abort signal.
 * @param {Object} [details={}] - The event details.
 * @returns {Promise} - A Promise that resolves when the event is captured.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const captureEventFn = async (event: MetricsEventName, signal: AbortSignal, details: object = {}): Promise<any> => {
  const isSignedIn = Storage.userIsLogged()
  const isRegistered = isSignedIn && Storage.getCurrentUser()

  if (!isRegistered && !Storage.getAnonymousId()) {
    Storage.setAnonymousId()
  }

  const body = {
    event,
    properties: {
      ...details,
      distinct_id: isRegistered ? undefined : Storage.getAnonymousId(),
      appId: 'DUOS',
      hostname: window.location.hostname,
      appPath: window.location.pathname,
      ...getDefaultProperties(),
    },
  }

  const url = `${await Config.getBardApiUrl()}/api/event`
  const headers = isRegistered ? { Authorization: `Bearer ${Token.getToken()}` } : undefined

  return fetchPost(url, body, { headers, signal })
}

/**
 * Syncs the user profile.
 *
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the profile is synced.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syncProfile = async (signal: AbortSignal): Promise<any> => {
  const url = `${await Config.getBardApiUrl()}/api/syncProfile`
  const headers = { Authorization: `Bearer ${Token.getToken()}` }
  return fetchPost(url, undefined, { headers, signal }).catch(() => {})
}

/**
 * Identifies the user with an anonymous ID.
 *
 * @param {string} anonId - The anonymous ID.
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the user is identified.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const identify = async (anonId: string, signal: AbortSignal): Promise<any> => {
  const body = { anonId }

  const url = `${await Config.getBardApiUrl()}/api/identify`
  const headers = { Authorization: `Bearer ${Token.getToken()}` }

  return fetchPost(url, body, { headers, signal }).catch(() => {})
}
