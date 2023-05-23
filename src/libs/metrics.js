import axios from 'axios';
import { getDefaultProperties } from '@databiosphere/bard-client';

import { Storage } from './storage';
import { getBardApiUrl } from './ajax';

export const Metrics = {
  captureEvent: (event, details, signal) => captureEventFn(event, details, signal).catch(() => { }),
  syncProfile: (signal) => syncProfile(signal),
  identify: (anonId, signal) => identify(anonId, signal),
};

/**
 * Captures an event with its details.
 *
 * @param {string} event - The event name.
 * @param {Object} [details={}] - The event details.
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the event is captured.
 */
const captureEventFn = async (event, details = {}, signal) => {
  const isSignedIn = Storage.userIsLogged();
  const isRegistered = isSignedIn && Storage.getCurrentUser();

  if (!isRegistered && !Storage.getAnonymousId()) {
    Storage.setAnonymousId();
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
  };

  const config = {
    method: 'POST',
    url: `${await getBardApiUrl()}/api/event`,
    data: body,
    headers: isRegistered ? { Authorization: `Bearer ${Storage.getGoogleData()?.accessToken}` } : undefined,
    signal,
  };

  return axios(config);
};

/**
 * Syncs the user profile.
 *
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the profile is synced.
 */
const syncProfile = async (signal) => {
  const config = {
    method: 'POST',
    url: `${await getBardApiUrl()}/api/syncProfile`,
    headers: { Authorization: `Bearer ${Storage.getGoogleData()?.accessToken}` },
    signal,
  };

  return axios(config).catch(() => { });
};

/**
 * Identifies the user with an anonymous ID.
 *
 * @param {string} anonId - The anonymous ID.
 * @param {AbortSignal} [signal] - The abort signal.
 * @returns {Promise} - A Promise that resolves when the user is identified.
 */
const identify = async (anonId, signal) => {
  const body = { anonId };

  const config = {
    method: 'POST',
    url: `${await getBardApiUrl()}/api/identify`,
    data: body,
    headers: { Authorization: `Bearer ${Storage.getGoogleData()?.accessToken}` },
    signal,
  };

  return axios(config).catch(() => { });
};


