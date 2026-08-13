/**
 * Determines whether to skip the 401 redirect for a given request.
 * This function checks if the request is a GET request to the DUOS API's auth probe endpoint (`/api/user/me`).
 * If the request does not meet these criteria, it returns false, indicating that the 401 redirect should not be skipped.
 * If the request is a GET request to the DUOS API's auth probe endpoint, it returns true, indicating that the 401 redirect should be skipped.
 * This is used to prevent infinite redirect loops when the auth probe endpoint returns a 401 response, which can happen if the user's session has expired or if they are not authenticated.
 *
 * @param url The URL of the request that resulted in a 401 response.
 * @param method The HTTP method of the request that resulted in a 401 response.
 * @param apiUrl The base URL of the DUOS API, used to determine if the request was made to the DUOS API.
 * @returns A boolean indicating whether to skip the 401 redirect.
 */
export const shouldSkip401Redirect = (
  url: string, method: string, apiUrl: string): boolean => {
  if (method !== 'GET') return false

  // Both URLs are resolved against the app origin: post-cutover apiUrl is the
  // relative BFF proxy prefix ('/duos-api'), which a bare `new URL()` rejects.
  const requestUrl = new URL(url, globalThis.location.origin)
  const apiBase = new URL(apiUrl, globalThis.location.origin)

  // Only handle 401s from the DUOS API
  if (requestUrl.hostname !== apiBase.hostname) return true

  // Only skip redirect for the auth probe endpoint, `${apiUrl}/api/user/me`
  const basePath = apiBase.pathname === '/' ? '' : apiBase.pathname
  return requestUrl.pathname === `${basePath}/api/user/me`
}
