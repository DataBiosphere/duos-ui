/*
    The /post-logout hand-off (BFF Phase 5, story 5-E).

    B2C requires `post_logout_redirect_uri` to match a URI registered on the
    app registration EXACTLY, so the local destination cannot ride in that URI.
    It is stored here before the logout POST and read back — once — when B2C
    returns the browser to /post-logout.

    Delete-on-read stops a stale value from redirecting a later visit, and the
    target is validated on write AND on read, so a tampered sessionStorage
    value can never produce an external or protocol-relative navigation.
*/

/** The one fixed post_logout_redirect_uri path registered with B2C. */
export const POST_LOGOUT_PATH = '/post-logout'

const POST_LOGOUT_TARGET_KEY = 'duos.postLogoutRedirectTo'

/**
 * Open-redirect guard for a local navigation target, mirroring the server's
 * safeReturnTo (server/src/auth/login.ts): accept only same-origin absolute
 * paths, and fall back to '/'. Requiring a leading '/' and then parsing
 * against a fixed base catches every classic bypass in one origin comparison —
 * 'https://evil.com' (absolute URL), '//evil.com' (protocol-relative),
 * '/\evil.com' (WHATWG URL parsing treats '\' as '/'), and encoded or
 * control-character variants — because the parser normalizes them all before
 * the check. Returning the parsed path also re-serializes any '../' segments.
 */
const SAFE_PATH_BASE = 'https://redirect.invalid'
export const safeLocalPath = (value: unknown): string => {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/'
  try {
    const url = new URL(value, SAFE_PATH_BASE)
    if (url.origin !== SAFE_PATH_BASE) return '/'
    return url.pathname + url.search + url.hash
  }
  catch {
    return '/'
  }
}

/** Records where /post-logout must send the browser after the B2C round-trip. */
export const storePostLogoutTarget = (target: string): void => {
  try {
    sessionStorage.setItem(POST_LOGOUT_TARGET_KEY, safeLocalPath(target))
  }
  catch {
    // Storage disabled (private mode, blocked site data) — /post-logout falls
    // back to '/'. A lost return path must not fail a sign-out.
  }
}

/** Drops a target that no navigation will consume (an unconfirmed sign-out). */
export const clearPostLogoutTarget = (): void => {
  try {
    sessionStorage.removeItem(POST_LOGOUT_TARGET_KEY)
  }
  catch {
    // Nothing to do — see storePostLogoutTarget.
  }
}

/**
 * Reads the stored target, DELETES it, and validates it again. Returns '/'
 * when the value is missing, unreadable, or not a same-origin path.
 */
export const takePostLogoutTarget = (): string => {
  let stored: string | null = null
  try {
    stored = sessionStorage.getItem(POST_LOGOUT_TARGET_KEY)
    sessionStorage.removeItem(POST_LOGOUT_TARGET_KEY)
  }
  catch {
    return '/'
  }
  return safeLocalPath(stored)
}
