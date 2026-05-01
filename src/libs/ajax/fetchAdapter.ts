import { redirectOnLogout } from 'src/libs/auth/auth'
import eventList from 'src/libs/events'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { StackdriverReporter } from 'src/libs/stackdriverReporter'
import { shouldSkip401Redirect } from 'src/utils/AuthRedirectUtils'
import { Config } from 'src/libs/config'

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

export const reportError = (url: string, status: number): void => {
  const msg = 'Error fetching response: '
    .concat(JSON.stringify(url))
    .concat('Status: ')
    .concat(String(status))
  // noinspection ES6MissingAwait,JSIgnoredPromiseFromCall
  StackdriverReporter.report(msg)
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

async function handleResponse<T>(
  res: Response,
  url: string,
  responseType: ResponseType,
  method: Method = 'GET',
): Promise<FetchData<T>> {
  if (!res.ok) {
    const apiUrl = await Config.getApiUrl()
    if (res.status === 401 && !shouldSkip401Redirect(url, method, apiUrl)) {
      // Record relevant 401 logouts to Bard / Mixpanel.
      // This gives systematic, empirical data to assess premature logout issues.
      // More context: https://github.com/DataBiosphere/duos-ui/pull/3389
      const oidcUser = Storage.getOidcUser()
      const expiresOn = oidcUser?.profile?.exp ?? null
      const currentTime = Math.floor(Date.now() / 1000)
      await Metrics.captureEvent(eventList.userAutoLogout401, {
        expires_on: expiresOn,
        current_time: currentTime,
        time_until_expires: expiresOn === null ? null : expiresOn - currentTime,
        endpoint_url: url,
      }, AbortSignal.timeout(1000)) // Wait <= 1s, abort if log slower
      redirectOnLogout()
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
    ? headers
    : { 'Content-Type': 'application/json', ...headers }

  const fetchOptions: MinimalRequestInit = {
    method,
    headers: finalHeaders,
    credentials,
    body: getRequestBody((data || undefined) as unknown as object | undefined, isMultipart),
    signal,
  }

  try {
    const fetchFn = fetch as unknown as (input: string, init?: unknown) => Promise<Response>
    const res = await fetchFn(fullUrl, fetchOptions)
    return handleResponse<T>(res, fullUrl, responseType, method)
  }
  catch (error) {
    // Re-throw AbortError without reporting
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    reportError(fullUrl, 502)
    throw new Error(`Request to ${fullUrl} failed with status 502`)
  }
}

async function fetchMultipartRequest<T>(
  options: FetchMultipartOptions,
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
    res = await fetchFn(fullUrl, fetchOptions)
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    reportError(fullUrl, 502)
    throw new Error(`Request to ${fullUrl} failed with status 502`)
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}. Please contact the help desk at duos@duos.org.`
    try {
      const errorData = await res.json() as { message?: string }
      if (errorData?.message) message = errorData.message
    }
    finally {
    reportError(fullUrl, res.status)
    throw new Error(message)
}

  }
  return handleResponse<T>(res, fullUrl, 'json', method)
}

export const fetchGet = <T>(
  url: string,
  config: FetchRequestConfig = {},
) => fetchRequest<T>({ url, ...config, method: 'GET' })

export const fetchPost = <T, TBody = unknown>(
  url: string,
  data?: TBody,
  config: FetchRequestConfig<TBody> = {},
) => fetchRequest<T>({ url, data, ...config, method: 'POST' })

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
