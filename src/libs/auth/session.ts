import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'

/**
 * The BFF session probe (`GET /auth/me`).
 *
 * With the BFF enabled, authentication state lives server-side in the BFF
 * session; the browser holds only the session cookie. Every "is the user
 * logged in?" question is therefore a network call, cached here per page load
 * so the many components that ask it during a render share one request. Auth
 * state only changes across full-page navigations (sign-in redirects to B2C
 * and back, sign-out reloads to '/'), so a page-load-scoped cache cannot go
 * stale — but resetSessionCache() is exported for the places that must not
 * rely on that.
 *
 * In a legacy (non-BFF) environment the /auth/* routes do not exist, so the
 * probe falls back to the synchronous oidc-client-ts token check in
 * localStorage. That path is deleted with the rest of the legacy flow in
 * Epic 6.
 */
export interface SessionInfo {
  authenticated: boolean
  /** The upstream DUOS user profile, forwarded by /auth/me when authenticated. */
  user?: DuosUser
  /** The B2C sub-provider the user chose on the B2C login page. */
  idp?: 'google' | 'microsoft'
}

let sessionPromise: Promise<SessionInfo> | null = null

const fetchSessionInfo = async (): Promise<SessionInfo> => {
  if (!(await Config.isBffEnabled())) {
    return { authenticated: Storage.userIsLogged() }
  }
  try {
    const res = await fetch('/auth/me', { credentials: 'include' })
    if (!res.ok) {
      // 401 = no session; 502 = upstream unavailable. Neither is "logged in",
      // and neither body carries a user profile worth keeping.
      return { authenticated: false }
    }
    return await res.json() as SessionInfo
  }
  catch {
    // Network failure — treat as signed out rather than crashing render paths.
    return { authenticated: false }
  }
}

export const getSessionInfo = (): Promise<SessionInfo> => {
  sessionPromise ??= fetchSessionInfo()
  return sessionPromise
}

export const resetSessionCache = (): void => {
  sessionPromise = null
}

/**
 * The async replacement for Storage.userIsLogged (story 4-E). The synchronous
 * localStorage check keeps working for the legacy flow; new code should ask
 * this instead (or the useUserIsLogged hook inside components).
 */
export const userIsLogged = async (): Promise<boolean> => {
  return (await getSessionInfo()).authenticated
}
