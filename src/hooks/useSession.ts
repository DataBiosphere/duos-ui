import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { SessionInfo, getSessionInfo } from 'src/libs/auth/session'

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

  useEffect(() => {
    let cancelled = false
    getSessionInfo().then((info) => {
      if (!cancelled) setSessionInfo(info)
    })
    return () => {
      cancelled = true
    }
  }, [location])

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
