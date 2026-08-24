import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { SessionInfo, getSessionInfo, revalidateSessionInfo } from 'src/libs/auth/session'

/**
 * React view of the BFF session probe (`GET /auth/me`, cached per page load in
 * session.ts). Returns `undefined` while the probe is in flight so render
 * paths can distinguish "still checking" from "signed out".
 *
 * Re-probes on every navigation (`location` is a new object per history entry,
 * including same-path navigations like signing out on /home): in legacy mode
 * auth state lives in localStorage and changes without a page load (popup
 * sign-in, /backgroundsignin), and the sign-in/out flows all end in a
 * navigation. In BFF mode the re-probe hits session.ts's page-load cache, so
 * it costs nothing. The previous answer is kept (not reset to `undefined`)
 * while re-probing.
 */
export const useSessionInfo = (): SessionInfo | undefined => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | undefined>(undefined)
  const location = useLocation()
  // Monotonic id of the most recently STARTED probe. The navigation and focus
  // effects race each other, and per-effect cancellation cannot order them —
  // a slow initial probe must not overwrite a newer revalidation's answer, or
  // downstream consumers (identity reconciliation in App) see time go backwards.
  const latestRequestId = useRef(0)

  const publishLatest = useCallback((probe: Promise<SessionInfo>) => {
    const requestId = ++latestRequestId.current
    probe.then((info) => {
      if (latestRequestId.current === requestId) setSessionInfo(info)
    })
  }, [])

  useEffect(() => {
    publishLatest(getSessionInfo())
  }, [location, publishLatest])

  // Revalidate when the tab regains focus: another tab can sign in or out on
  // the shared session cookie, and the fixed-lifetime session can expire while
  // the tab sits in the background. session.ts throttles the fan-out, so many
  // mounted hooks reacting to one focus event share a single probe.
  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState !== 'visible') return
      publishLatest(revalidateSessionInfo())
    }
    globalThis.addEventListener('focus', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    return () => {
      globalThis.removeEventListener('focus', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
    }
  }, [publishLatest])

  // Retire every in-flight probe on unmount so none of them publish late.
  useEffect(() => {
    const requests = latestRequestId
    return () => {
      requests.current++
    }
  }, [])

  return sessionInfo
}

/**
 * Async replacement for the old synchronous `Storage.userIsLogged()`:
 * `undefined` while the session probe is in flight, then the answer.
 */
export const useUserIsLogged = (): boolean | undefined => {
  const sessionInfo = useSessionInfo()
  return sessionInfo === undefined ? undefined : sessionInfo.authenticated
}
