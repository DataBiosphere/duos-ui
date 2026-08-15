import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { SessionInfo } from 'src/libs/auth/session'
import type { DuosUser } from 'src/types/model'
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
 * - Names the stored user (a real identity, not the empty default) → HYDRATE:
 *   refresh the local profile from the probe's server-fetched user and route
 *   to the ToS gate on an explicit rejection. Classification is recorded in
 *   React state so the refreshed profile re-renders mounted consumers.
 * - Anything else (no local identity, a session naming a different user, or
 *   a fresh probe with no profile — the cross-tab switch to an unregistered
 *   account) → the full post-sign-in BOOTSTRAP via completeSignIn.
 *
 * Bootstrap lifecycle guarantees:
 * - JOIN with provenance: a probe joins the in-flight run only for the same
 *   target identity, or when it names a user that storage acquired DURING
 *   the run (the run's own output, e.g. the post-registration re-probe). A
 *   probe naming the user storage held BEFORE the run started is an identity
 *   reversal and supersedes instead.
 * - SUPERSEDE with cancellation: superseding marks the old run's token
 *   cancelled — completeSignIn checks the token before each side-effecting
 *   step, so an obsolete run cannot persist a user, clear caches, emit
 *   metrics, navigate, or sign out after it has been replaced — and only the
 *   token still active at completion may unlock the routes.
 */

interface ActiveBootstrap {
  targetUserId: number
  /** What CurrentUser held when this run started — provenance for joins. */
  storedUserIdAtStart: number
  cancelled: boolean
}

interface ReconcilerSnapshot {
  /** The probe whose classification is recorded — in state, not just a ref,
   * so classification itself re-renders consumers of a hydrated profile. */
  classifiedProbe: SessionInfo | null
  /** True while a render-blocking full bootstrap is in flight. */
  bootstrapRunning: boolean
}

export interface SessionReconciliation {
  sessionInfo: SessionInfo | undefined
  isLoggedIn: boolean
  /** Render-visible: all identity-bearing UI (routes AND header) must stay
   * hidden while true, or it commits a stale identity. */
  reconciling: boolean
}

/** The auth-relevant surface of a profile: identity, role set, ToS state.
 * Cosmetic fields (display name, email) may lag one render — they cannot
 * grant access. */
const authProfileEquivalent = (a: DuosUser, b: DuosUser): boolean => {
  const roleNames = (u: DuosUser): string =>
    (u.roles ?? []).map(r => r.name).sort().join(',')
  return a.userId === b.userId
    && a.userStatusInfo?.tosAccepted === b.userStatusInfo?.tosAccepted
    && roleNames(a) === roleNames(b)
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
  // double-invocations, and the active bootstrap's token.
  const consumedProbeRef = useRef<SessionInfo | null>(null)
  const activeBootstrapRef = useRef<ActiveBootstrap | null>(null)

  useEffect(() => {
    if (!sessionInfo?.authenticated || consumedProbeRef.current === sessionInfo) return
    consumedProbeRef.current = sessionInfo

    const storedUserId = Storage.getCurrentUser().userId
    const sessionUser = sessionInfo.user
    const targetUserId = sessionUser?.userId ?? 0

    // Join the in-flight bootstrap when this probe is covered by it: same
    // target identity, or it names a user that storage acquired DURING the
    // run (that run's own output — the post-registration re-probe). A probe
    // naming the user storage held before the run started is an identity
    // reversal and falls through to supersede.
    const active = activeBootstrapRef.current
    const namesRunOutput = sessionUser !== undefined && sessionUser.userId !== 0
      && sessionUser.userId === storedUserId && storedUserId !== active?.storedUserIdAtStart
    if (active && (targetUserId === active.targetUserId || namesRunOutput)) {
      setSnapshot(prev => ({ ...prev, classifiedProbe: sessionInfo }))
      return
    }

    if (!active && sessionUser !== undefined && sessionUser.userId !== 0
      && sessionUser.userId === storedUserId) {
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

    // Full bootstrap, superseding any in-flight run: the old token is
    // cancelled so its remaining side effects are suppressed inside
    // completeSignIn and its completion cannot unlock the routes.
    if (active) {
      active.cancelled = true
    }
    const token: ActiveBootstrap = {
      targetUserId,
      storedUserIdAtStart: storedUserId,
      cancelled: false,
    }
    activeBootstrapRef.current = token
    setSnapshot({ classifiedProbe: sessionInfo, bootstrapRunning: true })
    // The BFF callback lands the browser on the destination itself, so the
    // pathname is the redirect target; the legacy popup flow reloads on the
    // landing page with the destination still in ?redirectTo=.
    const redirectTo = new URLSearchParams(location.search).get('redirectTo')
    completeSignIn({
      navigate,
      queryClient,
      redirectPath: redirectTo ?? location.pathname,
      isCancelled: () => token.cancelled,
    }).finally(() => {
      if (activeBootstrapRef.current !== token) return
      activeBootstrapRef.current = null
      setSnapshot(prev => ({ ...prev, bootstrapRunning: false }))
    })
  }, [sessionInfo, navigate, location.pathname, location.search, queryClient])

  const isLoggedIn = sessionInfo?.authenticated ?? false
  // An unclassified probe hides identity-bearing UI unless it matches the
  // stored profile on every auth-relevant field — same user with changed
  // roles or ToS state must not be committed off stale storage, while a
  // routine no-change revalidation must not blank the screen.
  const sessionUser = sessionInfo?.user
  const authEquivalent = sessionUser !== undefined && sessionUser.userId !== 0
    && authProfileEquivalent(sessionUser, Storage.getCurrentUser())
  const unclassifiedIdentityChange = sessionInfo !== snapshot.classifiedProbe && !authEquivalent
  const reconciling = isLoggedIn && (snapshot.bootstrapRunning || unclassifiedIdentityChange)

  return { sessionInfo, isLoggedIn, reconciling }
}
