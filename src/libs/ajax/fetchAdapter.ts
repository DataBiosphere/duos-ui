import { redirectOnLogout } from 'src/libs/auth/auth'
import eventList from 'src/libs/events'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'
import { BFF_BARD_PREFIX, Config } from 'src/libs/config'
import { CsrfTokenSessionExpiredError, getCsrfToken, isCsrfRejection, resetCsrfToken } from 'src/libs/ajax/csrf'

export type ResponseType = 'blob' | 'json' | 'text'
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type Credentials = 'omit' | 'same-origin' | 'include'
export type ParamValue = string | number | boolean
export type Params = Record<string, ParamValue>
export type HeadersMap = Record<string, string>
type FetchRequestConfig<TBody = unknown> = Omit<FetchRequestOptions<TBody>, 'url' | 'method' | 'data'>
type FetchMultipartConfig = Omit<FetchMultipartOptions, 'url' | 'method' | 'data'>

interface MinimalRequestInit {
  method: Method
  headers: HeadersMap
  credentials?: Credentials
  body?: string | FormData
  signal?: AbortSignal
}

interface FetchOptionsBase {
  url: string
  method?: Method
  params?: Params
  headers?: HeadersMap
  credentials?: Credentials
  signal?: AbortSignal
}

interface FetchRequestOptions<TBody = unknown> extends FetchOptionsBase {
  data?: TBody
  responseType?: ResponseType
  isMultipart?: boolean
}

interface FetchMultipartOptions extends Omit<FetchOptionsBase, 'method'> {
  method?: Exclude<Method, 'GET' | 'DELETE'>
  data?: FormData
}

export interface FetchData<T> {
  data: T
}

const HELP_DESK_MESSAGE = 'Please contact the help desk at duos@duos.org.'

export const reportError = async (url: string, status: number): Promise<void> => {
  // Requests to the Bard API are metrics calls (its only consumer). ErrorReporter
  // reports via metrics, so reporting a Bard failure would recurse infinitely.
  // In BFF mode identified metrics ride the /bard-api proxy — same recursion.
  const bardApiUrl = await Config.getBardApiUrl()
  if (url.startsWith(bardApiUrl) || url.startsWith(`${BFF_BARD_PREFIX}/`)) {
    return
  }
  const msg = 'Error fetching response: '
    .concat(JSON.stringify(url))
    .concat('Status: ')
    .concat(String(status))
  // noinspection ES6MissingAwait,JSIgnoredPromiseFromCall
  ErrorReporter.report(msg)
}

const UNSAFE_METHODS: ReadonlySet<Method> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// The CSRF token only means something to the BFF's own proxies — it must not
// be sent to another origin.
const isSameOrigin = (url: string): boolean =>
  new URL(url, globalThis.location.origin).origin === globalThis.location.origin

/**
 * Unsafe requests that must NOT carry (or fetch) a CSRF token: the signed-out
 * Contact Us form. Mirrors the server's CSRF_EXEMPT_UNSAFE_REQUESTS
 * (server/src/proxy/apiProxy.ts) — the server ignores the header here, and
 * fetching a token for a signed-out user would create an anonymous session
 * row per submission and hard-fail the form whenever /auth/csrf-token errors.
 */
const CSRF_EXEMPT_UNSAFE_REQUESTS: ReadonlySet<string> = new Set([
  'POST /duos-api/support/request',
  'POST /duos-api/support/upload',
])

const isCsrfExempt = (method: Method, url: string): boolean =>
  CSRF_EXEMPT_UNSAFE_REQUESTS.has(`${method} ${new URL(url, globalThis.location.origin).pathname}`)

const needsCsrfToken = (method: Method, url: string): boolean =>
  UNSAFE_METHODS.has(method) && isSameOrigin(url) && !isCsrfExempt(method, url)

// BFF mode: the proxies attach Authorization server-side from the session, so
// any bearer header the legacy authOpts()/multiPartOpts() helpers constructed
// is dropped before the request leaves the browser. Deliberately unconditional
// — cross-origin too: post-cutover the browser holds no valid token, so a
// surviving header could only be the helpers' 'Bearer undefined', which no
// upstream should receive.
const stripAuthorization = (headers: HeadersMap): void => {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === 'authorization') {
      delete headers[key]
    }
  }
}

function buildUrlWithParams(url: string, params?: Params): string {
  if (!params || Object.keys(params).length === 0) return url
  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      acc[k] = String(v)
      return acc
    }, {}),
  ).toString()
  return query ? `${url}?${query}` : url
}

/**
 * Guards the auto-logout handler against re-entering itself.
 *
 * The metric below is an identified event, so in BFF mode it posts to
 * /bard-api — an unsafe same-origin request, which fetches a CSRF token from
 * the gated /auth/csrf-token. The session is already gone, so that fetch
 * answers 401, and the adapter routes a 401 there straight back into this
 * handler. Unguarded, the outer `await` never resolves: redirectOnLogout()
 * never runs and the token endpoint is hit again on every turn. (reportError
 * above avoids the same loop for Bard URLs, one level further in.)
 *
 * The nested call returns without a metric and without a redirect; the
 * outer call finishes both exactly once.
 */
let autoLogoutInFlight = false

// Record relevant 401 logouts to Bard / Mixpanel, then start the sign-out
// redirect. The metric gives systematic, empirical data to assess premature
// logout issues. More context: https://github.com/DataBiosphere/duos-ui/pull/3389
const recordAutoLogout401 = async (url: string): Promise<void> => {
  if (autoLogoutInFlight) return
  autoLogoutInFlight = true
  const oidcUser = Storage.getOidcUser()
  const expiresOn = oidcUser?.profile?.exp ?? null
  const currentTime = Math.floor(Date.now() / 1000)
  try {
    await Metrics.captureEvent(eventList.userAutoLogout401, {
      expires_on: expiresOn,
      current_time: currentTime,
      time_until_expires: expiresOn === null ? null : expiresOn - currentTime,
      endpoint_url: url,
    }, AbortSignal.timeout(1000)) // Wait <= 1s, abort if log slower
  }
  finally {
    // The sign-out must start even if the metric throws, and the flag must
    // clear so a later 401 in a page that did not navigate still records.
    autoLogoutInFlight = false
    redirectOnLogout()
  }
}

/**
 * The session-expired path for a 401 from /auth/csrf-token itself (the
 * endpoint is gated on authentication — Epic 5, story 5-B). Runs the same
 * telemetry + redirect as a real 401 response and throws the same axios-like
 * shape, so callers cannot tell whether the session died before or after the
 * request went out.
 *
 * Deliberately NOT routed through shouldSkip401Redirect: that util judges
 * whether the TARGET upstream's 401 is authoritative about the DUOS session
 * (an ECM 401 is not). This 401 comes from the BFF itself, so it is always
 * authoritative — even when the blocked request was headed for a sibling
 * proxy prefix. No redirect loop is possible: Auth.signOut calls
 * getCsrfToken directly and consumes its own errors, and the telemetry
 * below cannot re-enter this handler — see autoLogoutInFlight.
 */
const throwSessionExpired = async (url: string): Promise<never> => {
  await recordAutoLogout401(url)
  reportError(url, 401)
  const error = new Error('Request failed with status 401') as Error & {
    response: { status: number, data: { message?: string, code?: number } }
  }
  error.response = { status: 401, data: {} }
  throw error
}

async function handleResponse<T>(
  res: Response,
  url: string,
  responseType: ResponseType,
  method: Method = 'GET',
): Promise<FetchData<T>> {
  if (!res.ok) {
    const apiUrl = await Config.getApiUrl()
    if (res.status === 401 && !shouldSkip401Redirect(url, method, apiUrl)) {
      await recordAutoLogout401(url)
    }
    reportError(url, res.status)

    // Parse error response and throw with axios-like structure for compatibility
    interface ErrorData {
      message?: string
      code?: number
    }
    let errorData: ErrorData = {}
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      try {
        errorData = await res.json()
      }
      catch {
        // If JSON parsing fails, use empty object
      }
    }
    const error = new Error(errorData.message || `Request failed with status ${res.status}`) as Error & {
      response: { status: number, data: ErrorData }
    }
    error.response = {
      status: res.status,
      data: errorData,
    }
    throw error
  }

  if (responseType === 'blob') {
    const blob = await res.blob()
    return { data: blob as T }
  }

  if (responseType === 'text') {
    const text: string = await res.text()
    return { data: text as T }
  }

  // Default to JSON
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const json: T = await res.json()
    return { data: json }
  }

  const text: string = await res.text()
  return { data: text as T }
}

function getRequestBody<TBody extends object>(
  data: TBody | undefined,
  isMultipart: boolean = false,
): string | FormData | undefined {
  if (!data) return undefined
  if (isMultipart) {
    return data instanceof FormData ? data : (data as unknown as FormData)
  }
  return JSON.stringify(data)
}

async function fetchRequest<T>(
  options: FetchRequestOptions,
  csrfRetried: boolean = false,
): Promise<FetchData<T>> {
  const {
    url,
    method = 'GET',
    data,
    params,
    headers = {},
    credentials,
    responseType = 'json',
    isMultipart = false,
    signal,
  } = options

  const fullUrl = params ? buildUrlWithParams(url, params) : url
  const finalHeaders: HeadersMap = isMultipart
    ? { ...headers }
    : { 'Content-Type': 'application/json', ...headers }

  const bffEnabled = await Config.isBffEnabled()
  if (bffEnabled) {
    stripAuthorization(finalHeaders)
  }

  const fetchOptions: MinimalRequestInit = {
    method,
    headers: finalHeaders,
    credentials,
    body: getRequestBody((data || undefined) as unknown as object | undefined, isMultipart),
    signal,
  }

  try {
    // Inside the try so an /auth/csrf-token failure gets the same reporting
    // and help-desk messaging as any other request failure.
    if (bffEnabled && needsCsrfToken(method, fullUrl)) {
      finalHeaders['X-CSRF-Token'] = await getCsrfToken()
    }
    const fetchFn = fetch as unknown as (input: string, init?: unknown) => Promise<Response>
    const res = await fetchFn(fullUrl, fetchOptions)
    if (bffEnabled && !csrfRetried && 'X-CSRF-Token' in finalHeaders && await isCsrfRejection(res)) {
      // Session rotation at login and destruction at logout both discard the
      // server-side CSRF secret — refetch the token once and retry.
      resetCsrfToken()
      return fetchRequest<T>(options, true)
    }
    return handleResponse<T>(res, fullUrl, responseType, method)
  }
  catch (error) {
    // The gated /auth/csrf-token said the session is gone — run the normal
    // session-expired handling instead of wrapping this as a generic failure.
    if (error instanceof CsrfTokenSessionExpiredError) {
      return throwSessionExpired(fullUrl)
    }
    // TypeError = network-level failure (offline, invalid URL, CORS, etc.) that never reached the server
    // DOMException (e.g. AbortError, NotAllowedError) = aborted request or blocked by permissions policy
    // Report with status 0 (no HTTP response) rather than 502 (bad gateway) to avoid misleading monitoring
    if (error instanceof TypeError || error instanceof DOMException) {
      reportError(fullUrl, 0)
      throw new Error(`Network error on request to ${fullUrl}: ${error.toString()} ${HELP_DESK_MESSAGE}`, { cause: error })
    }
    reportError(fullUrl, 0)
    throw new Error(`${error instanceof Error ? error.message : String(error)} ${HELP_DESK_MESSAGE}`, { cause: error })
  }
}

async function fetchMultipartRequest<T>(
  options: FetchMultipartOptions,
  csrfRetried: boolean = false,
): Promise<FetchData<T>> {
  const {
    url,
    method = 'POST',
    data,
    params,
    headers = {},
    credentials,
    signal,
  } = options

  const fullUrl = params ? buildUrlWithParams(url, params) : url

  // Ensure the browser sets the multipart boundary automatically
  const cleanHeaders = { ...headers }
  if (cleanHeaders['Content-Type']) {
    delete cleanHeaders['Content-Type']
  }

  const bffEnabled = await Config.isBffEnabled()
  if (bffEnabled) {
    stripAuthorization(cleanHeaders)
  }

  const fetchOptions: MinimalRequestInit = {
    method,
    headers: cleanHeaders,
    credentials,
    body: getRequestBody<FormData>(data, true),
    signal,
  }

  const fetchFn = fetch as unknown as (input: string, init?: unknown) => Promise<Response>
  let res: Response
  try {
    // Inside the try so an /auth/csrf-token failure gets the same reporting
    // and help-desk messaging as any other request failure. Multipart methods
    // are always unsafe (POST/PUT/PATCH).
    if (bffEnabled && needsCsrfToken(method, fullUrl)) {
      cleanHeaders['X-CSRF-Token'] = await getCsrfToken()
    }
    res = await fetchFn(fullUrl, fetchOptions)
  }
  catch (error) {
    // Same session-expired handling as fetchRequest — see throwSessionExpired.
    // Note this makes multipart slightly BETTER than its pre-gate behavior
    // (multipart's own error path never redirected on a real 401): the
    // csrf-token 401 is an unambiguous dead-session signal, so redirecting is
    // correct, not accidental.
    if (error instanceof CsrfTokenSessionExpiredError) {
      return throwSessionExpired(fullUrl)
    }
    // TypeError = network-level failure (offline, invalid URL, CORS, etc.) that never reached the server
    // DOMException (e.g. AbortError, NotAllowedError) = aborted request or blocked by permissions policy
    // Report with status 0 (no HTTP response) rather than 502 (bad gateway) to avoid misleading monitoring
    if (error instanceof TypeError || error instanceof DOMException) {
      reportError(fullUrl, 0)
      throw new Error(`Network error on request to ${fullUrl}: ${error.toString()} ${HELP_DESK_MESSAGE}`, { cause: error })
    }
    reportError(fullUrl, 0)
    throw new Error(`${error instanceof Error ? error.message : String(error)} ${HELP_DESK_MESSAGE}`, { cause: error })
  }
  if (bffEnabled && !csrfRetried && 'X-CSRF-Token' in cleanHeaders && await isCsrfRejection(res)) {
    // Same single retry as fetchRequest — see the note there.
    resetCsrfToken()
    return fetchMultipartRequest<T>(options, true)
  }
  if (!res.ok) {
    interface ErrorData {
      message?: string
      code?: number
    }
    let errorData: ErrorData = {}
    try {
      errorData = await res.json() as ErrorData
    }
    catch {
      // ignore parse errors, use generic message
    }
    const message = errorData.message || `Request failed with status ${res.status}. ${HELP_DESK_MESSAGE}`
    reportError(fullUrl, res.status)
    const error = new Error(message) as Error & { response: { status: number, data: ErrorData } }
    error.response = { status: res.status, data: errorData }
    throw error
  }
  return handleResponse<T>(res, fullUrl, 'json', method)
}

const RETRY_DELAYS_MS = [500, 1000, 2000]

const isRetryable = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status
  // Retry 5xx (transient server errors, e.g. service restart) and network errors (no HTTP response)
  return status === undefined || status >= 500
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    }, { once: true })
  })

const withRetry = async <T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    try {
      return await fn()
    }
    catch (error) {
      if (i === RETRY_DELAYS_MS.length || signal?.aborted || !isRetryable(error)) throw error
      await sleep(RETRY_DELAYS_MS[i] + Math.random() * 200, signal) // NOSONAR: non-cryptographic jitter to spread retry thundering herd
    }
  }
  throw new Error('unreachable')
}

export const fetchGet = <T>(
  url: string,
  config: FetchRequestConfig = {},
) => fetchRequest<T>({ url, ...config, method: 'GET' })

export const fetchBlob = async (
  url: string,
  config: FetchRequestConfig = {},
): Promise<Blob> => {
  const res = await fetchRequest<Blob>({
    url,
    ...config,
    method: 'GET',
    responseType: 'blob',
    headers: { Accept: 'application/octet-stream', ...config.headers },
  })
  return res.data
}

export const fetchPost = <T, TBody = unknown>(
  url: string,
  data?: TBody,
  config: FetchRequestConfig<TBody> = {},
) => fetchRequest<T>({ url, data, ...config, method: 'POST' })

export const retryFetchPost = <T, TBody = unknown>(
  url: string,
  data?: TBody,
  config: FetchRequestConfig<TBody> = {},
) => withRetry(() => fetchPost<T, TBody>(url, data, config), config.signal)

export const fetchPut = <T, TBody = unknown>(
  url: string,
  data?: TBody,
  config: FetchRequestConfig<TBody> = {},
) => fetchRequest<T>({ url, data, ...config, method: 'PUT' })

export const fetchPatch = <T, TBody = unknown>(
  url: string,
  data?: TBody,
  config: FetchRequestConfig<TBody> = {},
) => fetchRequest<T>({ url, data, ...config, method: 'PATCH' })

export const fetchDelete = <T>(
  url: string,
  config: FetchRequestConfig = {},
) => fetchRequest<T>({ url, data: (config as FetchRequestOptions).data, ...config, method: 'DELETE' })

export const fetchMultipart = <T>(
  url: string,
  formData: FormData,
  config: FetchMultipartConfig = {},
  method: Exclude<Method, 'GET' | 'DELETE'> = 'POST',
) => fetchMultipartRequest<T>({ url, data: formData, ...config, method })
