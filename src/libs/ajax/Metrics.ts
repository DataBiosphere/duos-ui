import axios, { AxiosRequestConfig } from 'axios'
import { getDefaultProperties } from '@databiosphere/bard-client'

import { Storage } from '../storage'
import { getBardApiUrl } from '../ajax'
import { Token } from '../config'
import { MetricsEventName } from 'src/libs/events'

// Set default timeout for all metrics calls to 30 seconds
const defaultSignal: AbortSignal = AbortSignal.timeout(30000)

export const Metrics = {
  captureEvent: (
    event: MetricsEventName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: Record<string, any> = {},
    signal: AbortSignal = defaultSignal,
    refreshAppcues: boolean = true,
  ) => captureEventFn(event, details, signal, refreshAppcues).catch(() => {
  }),
  syncProfile: (signal: AbortSignal = defaultSignal) => syncProfile(signal),
  identify: (anonId: string, signal: AbortSignal = defaultSignal) => identify(anonId, signal),
}

/**
 * Captures an event with its details.
 *
 * @param {string} event - The event name.
 * @param {Object} [details={}] - The event details.
 * @param {AbortSignal} [signal] - The abort signal.
 * @param refreshAppcues - The refresh Appcues flag.
 * @returns {Promise} - A Promise that resolves when the event is captured.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const captureEventFn = async (event: MetricsEventName, details: object = {}, signal: AbortSignal, refreshAppcues: boolean): Promise<any> => {
  const isSignedIn = Storage.userIsLogged()
  const isRegistered = isSignedIn && Storage.getCurrentUser()

  // Send event to Appcues and refresh Appcues state
  window.Appcues?.track(event)
  if (refreshAppcues) {
    window.Appcues?.page()
  }

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

  const config: AxiosRequestConfig = {
    method: 'POST',
    url: `${await getBardApiUrl()}/api/event`,
    data: body,
    headers: isRegistered ? { Authorization: `Bearer ${Token.getToken()}` } : undefined,
    signal,
  }

  return axios(config)
}

/**
 * Syncs the user profile.
 *
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the profile is synced.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syncProfile = async (signal: AbortSignal): Promise<any> => {
  const config: AxiosRequestConfig = {
    method: 'POST',
    url: `${await getBardApiUrl()}/api/syncProfile`,
    headers: { Authorization: `Bearer ${Token.getToken()}` },
    signal,
  }

  return axios(config).catch(() => {
  })
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

  if (window.Appcues) {
    const user = Storage.getCurrentUser()
    const oidcSub = Storage.getOidcUser()?.profile?.sub || Storage.getAnonymousId()
    const createDate = user.createDate ? user.createDate : new Date().getTime()
    const appcuesProps = {
      dateJoined: createDate,
      app: 'DUOS',
    }
    window.Appcues.identify(oidcSub, appcuesProps)
  }

  const config: AxiosRequestConfig = {
    method: 'POST',
    url: `${await getBardApiUrl()}/api/identify`,
    data: body,
    headers: { Authorization: `Bearer ${Token.getToken()}` },
    signal,
  }

  return axios(config).catch(() => {
  })
}
