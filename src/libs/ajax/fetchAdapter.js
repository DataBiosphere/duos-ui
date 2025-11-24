import { redirectOnLogout, reportError } from 'src/libs/ajax.js'

function buildUrlWithParams(url, params = {}) {
  const query = new URLSearchParams(params).toString()
  return query ? `${url}?${query}` : url
}

async function handleResponse(res, url, responseType, method = 'GET') {
  const isMeCheck = url?.endsWith('/api/user/me') && (method?.toLowerCase() === 'get')
  if (!res.ok) {
    if (res.status === 401 && !isMeCheck) {
      redirectOnLogout()
    }
    await reportError(url, res.status)
  }
  if (responseType === 'blob') {
    return { data: await res.blob() }
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return { data: await res.json() }
  }
  return { data: await res.text() }
}

function getRequestBody(data, isMultipart) {
  if (!data) return undefined
  return isMultipart ? data : JSON.stringify(data)
}

async function fetchRequest({ url, method = 'GET', data, params, headers = {}, credentials, responseType, isMultipart }) {
  const fullUrl = params ? buildUrlWithParams(url, params) : url
  const fetchOptions = {
    method,
    headers: isMultipart ? headers : { 'Content-Type': 'application/json', ...headers },
    credentials,
    body: getRequestBody(data, isMultipart),
  }
  try {
    const res = await fetch(fullUrl, fetchOptions)
    return handleResponse(res, fullUrl, responseType, method)
  }
  catch {
    reportError(fullUrl, 502) // Default to a 502 when we can't get a real response object.
    throw new Error(`Request to ${fullUrl} failed with status 502`)
  }
}

async function fetchMultipartRequest({ url, method = 'POST', data, params, headers = {}, credentials }) {
  const fullUrl = params ? buildUrlWithParams(url, params) : url
  const fetchOptions = {
    method,
    headers,
    credentials,
    body: getRequestBody(data, true),
    isMultipart: true,
  }
  if (headers['Content-Type']) {
    delete headers['Content-Type'] // Let the browser set the correct multipart boundary
  }
  try {
    const res = await fetch(fullUrl, fetchOptions)
    return handleResponse(res, url, undefined, method)
  }
  catch {
    reportError(url, 502) // Default to a 502 when we can't get a real response object.
    throw new Error(`Request to ${url} failed with status 502`)
  }
}

export const fetchGet = (url, config = {}) =>
  fetchRequest({ url, ...config, method: 'GET' })

export const fetchPost = (url, data, config = {}) =>
  fetchRequest({ url, data, ...config, method: 'POST' })

export const fetchPut = (url, data, config = {}) =>
  fetchRequest({ url, data, ...config, method: 'PUT' })

export const fetchPatch = (url, data, config = {}) =>
  fetchRequest({ url, data, ...config, method: 'PATCH' })

export const fetchDelete = (url, config = {}) =>
  fetchRequest({ url, data: config.data, ...config, method: 'DELETE' })

export const fetchMultipart = (url, formData, config = {}, method = 'POST') =>
  fetchMultipartRequest({ url, data: formData, ...config, method })
