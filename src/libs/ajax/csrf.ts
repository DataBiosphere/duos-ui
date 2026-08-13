/*
    X-CSRF-Token plumbing for BFF-mode requests (BFF Phase 4, story 4-D).

    The BFF enforces the token on /auth/logout and on unsafe methods through
    the API proxy. The token is fetched lazily from /auth/csrf-token and
    cached for the life of the page; the matching secret lives in the
    server-side session, so the cache must be invalidated whenever auth state
    changes (sign-out destroys the session, login rotation discards the
    pre-auth secret) or when the CSRF guard rejects a request.
*/

// A promise rather than the token itself, so concurrent unsafe requests share
// one /auth/csrf-token round-trip instead of racing to fetch their own.
let csrfTokenPromise: Promise<string> | null = null

export const getCsrfToken = (): Promise<string> => {
  csrfTokenPromise ??= fetch('/auth/csrf-token', { credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`CSRF token request failed with status ${res.status}`)
      }
      const { token } = await res.json() as { token: string }
      return token
    })
    .catch((error: unknown) => {
      // Never cache a failure — the next unsafe request should retry.
      csrfTokenPromise = null
      throw error
    })
  return csrfTokenPromise
}

export const resetCsrfToken = (): void => {
  csrfTokenPromise = null
}
