import { getDefaultProperties } from '@databiosphere/bard-client'

import { Storage } from 'src/libs/storage'
import { BFF_BARD_PREFIX, Config, Token } from 'src/libs/config'
import { MetricsEventName } from 'src/libs/events'
import { retryFetchPost } from 'src/libs/ajax/fetchAdapter'

// Set default timeout for all metrics calls to 30 seconds
const defaultSignal: AbortSignal = AbortSignal.timeout(30000)

// BFF NOTE: identified Bard calls authenticate with the user's token, which
// the browser no longer holds post-cutover — they go through the /bard-api
// proxy, where the session's token is attached server-side (Epic 3, story
// 3-K). Anonymous events carry no credentials and stay on the direct Bard URL.
const bardUrl = async (identified: boolean, path: string): Promise<string> => {
  if (identified && await Config.isBffEnabled()) {
    return `${BFF_BARD_PREFIX}${path}`
  }
  return `${await Config.getBardApiUrl()}${path}`
}

export const Metrics = {
  captureEvent: (
    event: MetricsEventName,
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
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
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
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
      hostname: globalThis.location.hostname,
      appPath: globalThis.location.pathname,
      ...getDefaultProperties(),
    },
  }

  const url = await bardUrl(Boolean(isRegistered), '/api/event')
  const headers = isRegistered ? { Authorization: `Bearer ${Token.getToken()}` } : undefined

  return retryFetchPost(url, body, { headers, signal })
}

/**
 * Syncs the user profile.
 *
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the profile is synced.
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
const syncProfile = async (signal: AbortSignal): Promise<any> => {
  const url = await bardUrl(true, '/api/syncProfile')
  const headers = { Authorization: `Bearer ${Token.getToken()}` }
  return retryFetchPost(url, undefined, { headers, signal }).catch(() => {})
}

/**
 * Identifies the user with an anonymous ID.
 *
 * @param {string} anonId - The anonymous ID.
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the user is identified.
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
const identify = async (anonId: string, signal: AbortSignal): Promise<any> => {
  const body = { anonId }

  const url = await bardUrl(true, '/api/identify')
  const headers = { Authorization: `Bearer ${Token.getToken()}` }

  return retryFetchPost(url, body, { headers, signal }).catch(() => {})
}
