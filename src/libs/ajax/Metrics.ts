import { getDefaultProperties } from '@databiosphere/bard-client'

import { Storage } from 'src/libs/storage'
import { Config } from 'src/libs/config'
import { MetricsEventName } from 'src/libs/events'
import { retryFetchPost } from 'src/libs/ajax/fetchAdapter'

// Set default timeout for all metrics calls to 30 seconds
const defaultSignal: AbortSignal = AbortSignal.timeout(30000)

// BFF NOTE: Bard is a separate upstream that the BFF proxy does not cover, and
// with the BFF the browser no longer holds a bearer token to authenticate
// with. Events are therefore captured anonymously against the persistent
// anonymousId. The authenticated identify/syncProfile calls are inert until a
// server-side Bard proxy route exists — a known gap in the Phase 4 plan,
// flagged for follow-up rather than silently 401ing against Bard.

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
 * Captures an event with its details, anonymously via the persistent anonymousId.
 *
 * @param {string} event - The event name.
 * @param {AbortSignal} [signal] - The abort signal.
 * @param {Object} [details={}] - The event details.
 * @returns {Promise} - A Promise that resolves when the event is captured.
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
const captureEventFn = async (event: MetricsEventName, signal: AbortSignal, details: object = {}): Promise<any> => {
  if (!Storage.getAnonymousId()) {
    Storage.setAnonymousId()
  }

  const body = {
    event,
    properties: {
      ...details,
      distinct_id: Storage.getAnonymousId(),
      appId: 'DUOS',
      hostname: globalThis.location.hostname,
      appPath: globalThis.location.pathname,
      ...getDefaultProperties(),
    },
  }

  const url = `${await Config.getBardApiUrl()}/api/event`

  return retryFetchPost(url, body, { signal })
}

/**
 * Syncs the user profile. Requires an Authorization header Bard-side, which
 * the client can no longer produce — inert until Bard is proxied by the BFF.
 *
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the profile is synced.
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
const syncProfile = async (_signal: AbortSignal): Promise<any> => {
  // No client-side token to authenticate with — see BFF NOTE above.
  return Promise.resolve()
}

/**
 * Identifies the user with an anonymous ID. Requires an Authorization header
 * Bard-side, which the client can no longer produce — inert until Bard is
 * proxied by the BFF.
 *
 * @param {string} anonId - The anonymous ID.
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the user is identified.
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
const identify = async (_anonId: string, _signal: AbortSignal): Promise<any> => {
  // No client-side token to authenticate with — see BFF NOTE above.
  return Promise.resolve()
}
