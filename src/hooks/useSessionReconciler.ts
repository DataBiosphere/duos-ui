import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { SessionInfo } from 'src/libs/auth/session'
import { useSessionInfo } from 'src/hooks/useSession'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { Storage } from 'src/libs/storage'
import { setUserRoleStatuses } from 'src/libs/utils'

/**
 * Reconciles the BFF session identity with the locally stored profile.
 *
 * Each FRESH probe result (a new object from useSessionInfo — the cached
 * probe returns the same object, so re-renders and StrictMode double
 * invocations are inert) is classified exactly once:
 *
 * - Names the stored user → HYDRATE: refresh the local profile from the
 *   probe's server-fetched user (roles/ToS change between page loads; the
 *   popup flow reconciled on every sign-in) and route to the ToS gate on an
 *   explicit rejection. Classification is recorded in React state so the
 *   refreshed profile re-renders — a bare localStorage write is invisible to
 *   mounted components.
 * - Anything else (no local user after the OAuth callback, a session naming
 *   a different user, or a fresh probe with no profile — the cross-tab
 *   switch to an unregistered account) → the full post-sign-in BOOTSTRAP
 *   (user fetch / registration / metrics / ToS gate) via completeSignIn.
 *
 * Bootstraps are generation-guarded: a probe for the identity an in-flight
 * bootstrap is already handling joins that run; a genuinely different
 * identity supersedes it, and a superseded run's completion can no longer
 * unlock the routes.
 */

interface ReconcilerSnapshot {
  /** The probe whose classification is recorded — in state, not just a ref,
   * so classification itself causes the re-render that propagates a
   * hydrated profile. */
  classifiedProbe: SessionInfo | null
  /** True while the render-blocking full bootstrap is in flight. */
  bootstrapRunning: boolean
}

export interface SessionReconciliation {
  sessionInfo: SessionInfo | undefined
  isLoggedIn: boolean
  /** Render-visible: the routes must stay hidden while this is true, or they
   * commit a stale identity (previous user's roles under a new session). */
  reconciling: boolean
}

export const useSessionReconciler = (queryClient: QueryClient): SessionReconciliation => {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionInfo = useSessionInfo()
  const [snapshot, setSnapshot] = useState<ReconcilerSnapshot>({
    classifiedProbe: null,
    bootstrapRunning: false,
  })
  // Effect-only guards (never read during render): idempotence for StrictMode
  // double-invocations, and the active bootstrap's generation + target.
  const consumedProbeRef = useRef<SessionInfo | null>(null)
  const bootstrapGenerationRef = useRef(0)
  const activeBootstrapRef = useRef<{ generation: number, targetUserId: number } | null>(null)

  useEffect(() => {
    if (!sessionInfo?.authenticated || consumedProbeRef.current === sessionInfo) return
    consumedProbeRef.current = sessionInfo

    const storedUserId = Storage.getCurrentUser().userId
    const sessionUser = sessionInfo.user
    const targetUserId = sessionUser?.userId ?? 0

    // A probe for work the in-flight bootstrap already covers joins that run:
    // same target identity, or a probe that now names the user the bootstrap
    // just persisted (the post-registration re-probe). Starting a concurrent
    // completeSignIn here would duplicate registration, metrics, and routing.
    const active = activeBootstrapRef.current
    if (active && (targetUserId === active.targetUserId || (sessionUser !== undefined && sessionUser.userId === storedUserId))) {
      setSnapshot(prev => ({ ...prev, classifiedProbe: sessionInfo }))
      return
    }

    if (!active && sessionUser !== undefined && sessionUser.userId === storedUserId) {
      Storage.setCurrentUser(sessionUser)
      setUserRoleStatuses(sessionUser, Storage)
      // Recorded in state → clean re-render off the refreshed profile.
      setSnapshot(prev => ({ ...prev, classifiedProbe: sessionInfo }))
      // Only an explicit "not accepted" routes to the gate — a profile without
      // status info (older legacy sessions, service accounts) is left alone.
      const tosRejected = sessionUser.userStatusInfo?.tosAccepted === false
      if (tosRejected && !location.pathname.startsWith('/tos')) {
        navigate('/tos_acceptance')
      }
      return
    }

    // Full bootstrap. Superseding an in-flight run bumps the generation, so
    // the older run's completion below cannot unlock the routes early.
    const generation = ++bootstrapGenerationRef.current
    activeBootstrapRef.current = { generation, targetUserId }
    setSnapshot({ classifiedProbe: sessionInfo, bootstrapRunning: true })
    // The BFF callback lands the browser on the destination itself, so the
    // pathname is the redirect target; the legacy popup flow reloads on the
    // landing page with the destination still in ?redirectTo=.
    const redirectTo = new URLSearchParams(location.search).get('redirectTo')
    completeSignIn({ navigate, queryClient, redirectPath: redirectTo ?? location.pathname })
      .finally(() => {
        if (activeBootstrapRef.current?.generation !== generation) return
        activeBootstrapRef.current = null
        setSnapshot(prev => ({ ...prev, bootstrapRunning: false }))
      })
  }, [sessionInfo, navigate, location.pathname, location.search, queryClient])

  const isLoggedIn = sessionInfo?.authenticated ?? false
  // An unclassified probe hides the routes only when it could change the
  // rendered identity (fresh callback, no profile, or a different user) —
  // a probe naming the stored user hydrates without blanking the screen on
  // every focus revalidation.
  const storedUserId = Storage.getCurrentUser().userId
  const sessionUserId = sessionInfo?.user?.userId
  const unclassifiedIdentityChange = sessionInfo !== snapshot.classifiedProbe
    && (storedUserId === 0 || sessionUserId === undefined || sessionUserId !== storedUserId)
  const reconciling = isLoggedIn && (snapshot.bootstrapRunning || unclassifiedIdentityChange)

  return { sessionInfo, isLoggedIn, reconciling }
}
