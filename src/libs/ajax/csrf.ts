/*
    X-CSRF-Token plumbing for BFF-mode requests (BFF Phase 4, story 4-D).

    The BFF enforces the token on /auth/logout and on unsafe methods through
    the API proxy. The token is fetched lazily from /auth/csrf-token and
    cached for the life of the page; the matching secret lives in the
    server-side session, so the cache is invalidated when sign-out destroys
    the session and when the CSRF guard rejects a request. Login needs no
    explicit reset: sign-in is a full-page redirect, so the post-callback
    page starts with a fresh module (and fetches a fresh token minted for
    the rotated session).
*/

/**
 * The error code the BFF sends on a CSRF rejection — must match the server's
 * CSRF_ERROR_CODE in server/src/proxy/upstreamProxy.ts (the two live in
 * different compilation roots, so they cannot share one constant).
 */
export const CSRF_ERROR_CODE = 'csrf_validation_failed'

/**
 * A CSRF rejection is identified by the body, NOT by the 403 status alone: an
 * authorization denial from the upstream DUOS API is an ordinary proxied
 * response and arrives as a 403 too, so retrying on the status would replay
 * every write the API refused (ADR-010). The BFF also sends a `reason` field —
 * that is for a human reading a network tab; do not branch on it.
 */
export const isCsrfRejection = async (res: Response): Promise<boolean> => {
  if (res.status !== 403) return false
  try {
    const body = await res.clone().json() as { error?: string }
    return body.error === CSRF_ERROR_CODE
  }
  catch {
    return false
  }
}

/**
 * Thrown when /auth/csrf-token answers 401 — the endpoint is gated on an
 * authenticated session (Epic 5, story 5-B), so its 401 means the BFF session
 * is expired or signed out. Typed so the fetch adapter can run the normal
 * session-expired handling (metric + redirectOnLogout) instead of surfacing a
 * generic help-desk error for a request that never got sent. This signal comes
 * from the BFF itself, so it is authoritative about the DUOS session no matter
 * which upstream the blocked request was headed for.
 */
export class CsrfTokenSessionExpiredError extends Error {
  constructor() {
    super('The CSRF token request returned 401: the BFF session is expired or signed out')
    this.name = 'CsrfTokenSessionExpiredError'
  }
}

// A promise rather than the token itself, so concurrent unsafe requests share
// one /auth/csrf-token round-trip instead of racing to fetch their own.
let csrfTokenPromise: Promise<string> | null = null

export const getCsrfToken = (): Promise<string> => {
  csrfTokenPromise ??= fetch('/auth/csrf-token', { credentials: 'include' })
    .then(async (res) => {
      if (res.status === 401) {
        throw new CsrfTokenSessionExpiredError()
      }
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
