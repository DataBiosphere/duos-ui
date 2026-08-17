import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'

/**
 * The BFF session probe (`GET /auth/me`).
 *
 * With the BFF enabled, authentication state lives server-side in the BFF
 * session; the browser holds only the session cookie. Every "is the user
 * logged in?" question is therefore a network call, cached here so the many
 * components that ask it during a render share one request. Sign-in and
 * sign-out in THIS tab are full-page navigations, but the answer can still go
 * stale underneath a long-lived tab — the fixed-lifetime session expires, or
 * another tab signs in or out on the shared cookie — so the cache is bounded
 * by SESSION_TTL_MS and revalidateSessionInfo() exists for focus/visibility
 * changes. (A stale "signed in" is UI-only exposure: the first real API call
 * after expiry still 401s and signs the user out.)
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

/**
 * How long a cached probe answer is trusted. The cache mainly exists so the
 * many components that ask during one render share a single request; the TTL
 * bounds how long a stale answer can outlive reality (the fixed-lifetime BFF
 * session can expire mid-use, and another tab can sign in or out on the
 * shared cookie). Focus/visibility revalidation reacts faster; this is the
 * backstop for long-lived tabs that keep navigating.
 */
const SESSION_TTL_MS = 5 * 60 * 1000

/** Floor between forced revalidations, so a burst of focus events (or many
 * mounted hooks reacting to one) collapses into a single probe. */
const REVALIDATE_MIN_INTERVAL_MS = 3 * 1000

let sessionPromise: Promise<SessionInfo> | null = null
let sessionFetchedAt = 0

/**
 * The last answer /auth/me actually gave (200 or 401). A transient failure
 * (502, network) says nothing about the session, so it reports this instead
 * of flipping to signed-out — one upstream blip must not unmount every
 * authenticated route (Authenticated navigates away and loses form state)
 * or retire an in-flight bootstrap. The risk of a stale "signed in" here is
 * the same UI-only exposure the TTL comment above accepts: the first real
 * API call after expiry still 401s and signs the user out.
 */
let lastAuthoritativeAnswer: SessionInfo | null = null

const probeBffSession = async (): Promise<SessionInfo> => {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' })
    if (res.status === 401) {
      // A real answer — no session — worth caching for the page load.
      lastAuthoritativeAnswer = { authenticated: false }
      return lastAuthoritativeAnswer
    }
    if (!res.ok) {
      // Transient upstream failure (e.g. 502): hold the last real answer for
      // this ask, but drop the cache so the next ask retries instead of
      // pinning the stale answer for the rest of the page load.
      resetSessionCache()
      return lastAuthoritativeAnswer ?? { authenticated: false }
    }
    const info = await res.json() as SessionInfo
    lastAuthoritativeAnswer = info
    return info
  }
  catch {
    // Network failure — same as above: last real answer now, retry next ask.
    resetSessionCache()
    return lastAuthoritativeAnswer ?? { authenticated: false }
  }
}

export const getSessionInfo = async (): Promise<SessionInfo> => {
  try {
    if (!(await Config.isBffEnabled())) {
      // Legacy: a free synchronous read, deliberately never cached — the popup
      // sign-in flow and the dev-only /backgroundsignin page both mutate
      // localStorage without a page load, so a cached answer would go stale.
      // (config.json itself is promise-cached, so this costs nothing.)
      // The stored user IS the legacy identity, so reporting it here means
      // identity-reconciliation checks (session user vs stored user) are
      // trivially satisfied in legacy mode.
      const authenticated = Storage.userIsLogged()
      return authenticated
        ? { authenticated, user: Storage.getCurrentUser() }
        : { authenticated }
    }
  }
  catch {
    // Config failure — treat as signed out rather than crashing render paths.
    return { authenticated: false }
  }
  if (sessionPromise && Date.now() - sessionFetchedAt > SESSION_TTL_MS) {
    sessionPromise = null
  }
  if (!sessionPromise) {
    sessionFetchedAt = Date.now()
    sessionPromise = probeBffSession()
  }
  return sessionPromise
}

export const resetSessionCache = (): void => {
  sessionPromise = null
}

/**
 * Test seam: drops the remembered authoritative answer along with the cache.
 * Production code wants resetSessionCache — the held answer must survive a
 * cache reset, or it could not bridge the transient failures it exists for.
 */
export const resetSessionProbeState = (): void => {
  sessionPromise = null
  lastAuthoritativeAnswer = null
}

/**
 * Drop the cached answer and probe again — for "the world may have changed"
 * moments like the tab regaining focus (another tab can sign in or out on the
 * shared session cookie). Throttled so simultaneous callers share one probe.
 */
export const revalidateSessionInfo = (): Promise<SessionInfo> => {
  if (Date.now() - sessionFetchedAt > REVALIDATE_MIN_INTERVAL_MS) {
    resetSessionCache()
  }
  return getSessionInfo()
}

/**
 * The async replacement for Storage.userIsLogged (story 4-E). The synchronous
 * localStorage check keeps working for the legacy flow; new code should ask
 * this instead (or the useUserIsLogged hook inside components).
 */
export const userIsLogged = async (): Promise<boolean> => {
  return (await getSessionInfo()).authenticated
}
