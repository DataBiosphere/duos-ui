/**
 * Normalizes a URL to its pathname with numeric path segments replaced by ':id'.
 * This allows pattern matching against parameterized routes,
 * e.g. /api/dac/123/rules → /api/dac/:id/rules
 */
const normalizePath = (url: string): string =>
  new URL(url, globalThis.location.origin).pathname
    .split('/')
    .map(part => (/^\d+$/.test(part) ? ':id' : part))
    .join('/')

/**
 * Returns true when the user is currently on the Data Library page (/datalibrary or /datalibrary/*).
 */
const isDataLibraryRoute = (): boolean => {
  const path = globalThis.location.pathname.toLowerCase()
  return path === '/datalibrary' || path.startsWith('/datalibrary/')
}

/**
 * Background GET endpoints on the Data Library page that may return 401 due to
 * missing resource permissions rather than an expired session.
 * A 401 from these should not force a logout redirect.
 */
const DATA_LIBRARY_SKIP_401_PATHS = new Set([
  '/api/repository/v1/snapshots',
  '/api/dac/:id/rules',
])

/**
 * Determines whether a 401 response should suppress the global logout redirect.
 *
 * Two categories of exemptions:
 *  1. GET /api/user/me — used internally to probe auth state; handled separately
 *     by the auth layer and should not trigger a forced logout.
 *  2. Data Library background endpoints — may return 401 due to missing resource
 *     permissions rather than an expired session, so the user should not be
 *     logged out while browsing the library.
 *
 * All non-GET requests fall through immediately: a 401 on a mutating request
 * almost always means the session is invalid and logout is the correct response.
 */
export const shouldSkip401Redirect = (url: string, method: string): boolean => {
  if (method !== 'GET') return false

  const pathname = normalizePath(url)

  if (pathname === '/api/user/me') return true

  return isDataLibraryRoute() && DATA_LIBRARY_SKIP_401_PATHS.has(pathname)
}
