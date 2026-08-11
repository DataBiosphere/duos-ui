import { useEffect, useState } from 'react'
import { SessionInfo, getSessionInfo } from 'src/libs/auth/session'

/**
 * React view of the BFF session probe (`GET /auth/me`, cached per page load in
 * session.ts). Returns `undefined` while the probe is in flight so render
 * paths can distinguish "still checking" from "signed out".
 */
export const useSessionInfo = (): SessionInfo | undefined => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    getSessionInfo().then((info) => {
      if (!cancelled) setSessionInfo(info)
    })
    return () => {
      cancelled = true
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
