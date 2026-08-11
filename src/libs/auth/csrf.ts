/**
 * CSRF token cache for the BFF's double-submit protection.
 *
 * The BFF enforces an X-CSRF-Token header on /auth/logout and on every proxied
 * unsafe method (POST/PUT/PATCH/DELETE). Tokens come from GET /auth/csrf-token
 * and are minted from a per-session secret, so one fetched token stays valid
 * until the session's secret changes — which happens when auth state changes
 * (session rotation at login, destruction at logout). resetCsrfToken() must be
 * called at those points, and when the server rejects a request with
 * `{ error: 'csrf_validation_failed' }` (fetchAdapter refetches once and
 * retries).
 */
let csrfToken: string | undefined

export const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    const res = await fetch('/auth/csrf-token', { credentials: 'include' })
    csrfToken = ((await res.json()) as { token: string }).token
  }
  return csrfToken
}

export const resetCsrfToken = (): void => {
  csrfToken = undefined
}

/** The one header spelling the BFF reads a CSRF token from (see server csrf.ts). */
export const CSRF_HEADER = 'X-CSRF-Token'
