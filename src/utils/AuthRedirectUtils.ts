/**
 * Determines whether to skip the 401 redirect for a given request.
 *
 * Classification happens on the URL first, before any method check: a 401
 * from anything other than the DUOS API is not authoritative about the DUOS
 * session, regardless of HTTP method, so the redirect (which signs the user
 * out) is always skipped. "Other than the DUOS API" covers both different
 * hostnames and — post-cutover, when the upstream proxies share the app's
 * hostname — paths outside the DUOS proxy prefix (/ecm-api, /tdr-api,
 * /bard-api). ECM and identified Bard calls are POSTs, so classifying by
 * method first would let their upstream 401s destroy a valid DUOS session.
 *
 * For DUOS API requests, only the GET auth probe (`${apiUrl}/api/user/me`)
 * skips the redirect: it 401s benignly whenever the user is simply not
 * signed in, which must not loop back into another redirect.
 *
 * @param url The URL of the request that resulted in a 401 response.
 * @param method The HTTP method of the request that resulted in a 401 response.
 * @param apiUrl The base URL of the DUOS API, used to determine if the request was made to the DUOS API.
 * @returns A boolean indicating whether to skip the 401 redirect.
 */
export const shouldSkip401Redirect = (
  url: string, method: string, apiUrl: string): boolean => {
  // Both URLs are resolved against the app origin: post-cutover apiUrl is the
  // relative BFF proxy prefix ('/duos-api'), which a bare `new URL()` rejects.
  const requestUrl = new URL(url, globalThis.location.origin)
  const apiBase = new URL(apiUrl, globalThis.location.origin)

  // Only handle 401s from the DUOS API
  if (requestUrl.hostname !== apiBase.hostname) return true

  // Post-cutover the non-DUOS upstream proxies (/ecm-api, /tdr-api, /bard-api)
  // share the app's hostname, but their 401s are not authoritative about the
  // DUOS session (an ECM or TDR auth problem must not sign the user out) —
  // treat anything outside the DUOS proxy prefix as non-DUOS.
  // Strip trailing slashes without a regex: `/\/+$/` backtracks
  // super-linearly (Sonar S8786)
  let basePath = apiBase.pathname
  while (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1)
  }
  if (basePath && !requestUrl.pathname.startsWith(`${basePath}/`)) return true

  // A DUOS API 401: any non-GET means the session is really gone — redirect.
  if (method !== 'GET') return false

  // Only skip redirect for the auth probe endpoint, `${apiUrl}/api/user/me`
  return requestUrl.pathname === `${basePath}/api/user/me`
}
