// B2C requires an exact registered URI; sessionStorage carries the local target.
export const POST_LOGOUT_PATH = '/post-logout'

const POST_LOGOUT_TARGET_KEY = 'duos.postLogoutRedirectTo'

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

export const storePostLogoutTarget = (target: string): void => {
  try {
    sessionStorage.setItem(POST_LOGOUT_TARGET_KEY, safeLocalPath(target))
  }
  catch {}
}

export const clearPostLogoutTarget = (): void => {
  try {
    sessionStorage.removeItem(POST_LOGOUT_TARGET_KEY)
  }
  catch {}
}

/** Consumes and revalidates the stored target. */
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
