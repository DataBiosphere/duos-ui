import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { NavigateFunction } from 'react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { SessionInfo } from 'src/libs/auth/session'
import type { DuosUser } from 'src/types/model'
import { useSessionInfo } from 'src/hooks/useSession'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { Redirect } from 'src/libs/auth/auth'
import { Storage } from 'src/libs/storage'
import { setUserRoleStatuses } from 'src/libs/utils'

/**
 * Reconciles the BFF session identity with the locally stored profile.
 *
 * SCOPE POLICY: concurrent different-user tabs are unsupported. The session
 * cookie is shared, so "two users in two tabs" was never real — only serial
 * account switching with a stale tab. A stale tab that detects an identity
 * conflict UNDER AN IN-FLIGHT BOOTSTRAP hard-reloads (the fresh page load
 * reconciles from scratch and kills all in-flight work); this deliberately
 * replaces in-place supersede/join-provenance machinery. Within a single
 * tab, localStorage therefore has a single writer.
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
 *   a fresh probe with no profile) → the full post-sign-in BOOTSTRAP via
 *   completeSignIn.
 *
 * Bootstrap lifecycle:
 * - A probe covered by the in-flight run joins it: same target identity, or
 *   naming the user the run itself persisted (single-writer, per the policy
 *   above — storage changes during a run are the run's own output).
 * - A conflicting identity during a run → cancel + hard reload (policy).
 * - The probe turning unauthenticated, or unmount, cancels the run: a
 *   cancelled completeSignIn performs no further side effects.
 */

interface ActiveBootstrap {
  targetUserId: number
  cancelled: boolean
  /** The freshest same-user profile carried by a probe that JOINED this run.
   * The run's own (older) getMe response may land after that probe, so the
   * joined profile is applied when the run completes — otherwise a
   * same-user authorization change arriving mid-bootstrap would be lost. */
  pendingHydration?: DuosUser
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

/** The auth-relevant surface of a profile: identity, role assignments
 * (including which DAC each role is scoped to), and account/ToS status.
 * Cosmetic fields (display name, email) may lag one render — they cannot
 * grant access. */
const authProfileEquivalent = (a: DuosUser, b: DuosUser): boolean => {
  const roleKeys = (u: DuosUser): string =>
    (u.roles ?? []).map(r => `${r.name}:${r.dacId ?? ''}`).sort((x, y) => x.localeCompare(y)).join(',')
  const status = (u: DuosUser) => u.userStatusInfo
  return a.userId === b.userId
    && status(a)?.tosAccepted === status(b)?.tosAccepted
    && status(a)?.enabled === status(b)?.enabled
    && status(a)?.adminEnabled === status(b)?.adminEnabled
    && roleKeys(a) === roleKeys(b)
}

/** Whether a fresh probe is covered by the in-flight run: same target
 * identity, or — for a registration run (target 0) only — naming the user the
 * run itself persisted (single-writer, per the scope policy: storage changes
 * during a run are the run's own output). Runs targeting a named user are
 * already covered by the target match, so a probe naming a DIFFERENT stored
 * user during one is a genuine conflict. */
const probeCoveredByRun = (active: ActiveBootstrap, sessionUser: DuosUser | undefined, storedUserId: number): boolean => {
  const targetUserId = sessionUser?.userId ?? 0
  return targetUserId === active.targetUserId
    || (active.targetUserId === 0 && sessionUser !== undefined
      && sessionUser.userId !== 0 && sessionUser.userId === storedUserId)
}

/** Only an explicit "not accepted" routes to the gate — a profile without
 * status info (older legacy sessions, service accounts) is left alone. */
const tosExplicitlyRejected = (user: DuosUser, pathname: string): boolean =>
  user.userStatusInfo?.tosAccepted === false && !pathname.startsWith('/tos')

/** Persist the freshest profile a joined probe carried, once its run
 * completes. Same explicit-rejection rule as the hydrate path. The router
 * location closure may be stale by completion time — read the live one
 * (they coincide outside MemoryRouter tests). */
const applyPendingHydration = (fresh: DuosUser, navigate: NavigateFunction): void => {
  // setUserRoleStatuses persists the user itself (utils.ts).
  setUserRoleStatuses(fresh, Storage)
  if (tosExplicitlyRejected(fresh, globalThis.location.pathname)) {
    navigate('/tos_acceptance')
  }
}

/** Drops the per-tab query cache when the tab starts serving a different
 * identity than the one the cache was populated under. A cross-tab account
 * switch arrives at the hydrate path looking routine (shared storage already
 * names the new user), but this tab's cache still holds the previous
 * identity's role-scoped results. */
const ensureCacheIdentity = (
  cacheIdentity: { current: number },
  queryClient: QueryClient,
  userId: number,
): void => {
  if (cacheIdentity.current === userId) return
  queryClient.clear()
  cacheIdentity.current = userId
}

/** A probe that names the stored user (a real identity, not the empty
 * default) hydrates the local profile instead of bootstrapping. */
const probeNamesStoredUser = (sessionUser: DuosUser | undefined, storedUserId: number): sessionUser is DuosUser =>
  sessionUser !== undefined && sessionUser.userId !== 0
  && sessionUser.userId === storedUserId

export const useSessionReconciler = (queryClient: QueryClient): SessionReconciliation => {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionInfo = useSessionInfo()
  const [snapshot, setSnapshot] = useState<ReconcilerSnapshot>({
    classifiedProbe: null,
    bootstrapRunning: false,
  })
  // Effect-only guards (never read during render): idempotence for StrictMode
  // double-invocations, and the active bootstrap's cancellation token.
  const consumedProbeRef = useRef<SessionInfo | null>(null)
  const activeBootstrapRef = useRef<ActiveBootstrap | null>(null)
  // The identity this tab's QueryClient was populated under. localStorage is
  // shared across tabs but the query cache is per-tab: when another tab
  // switches accounts, this tab's next probe MATCHES the (already-switched)
  // stored user and hydrates — with the previous user's role-scoped query
  // results still resident. Storage cannot answer "whose data does THIS
  // tab's cache hold", so the tab tracks it itself and clears on change.
  const cacheIdentityRef = useRef<number>(Storage.getCurrentUser().userId)

  // Unmount cancels whatever is in flight.
  useEffect(() => () => {
    if (activeBootstrapRef.current) {
      activeBootstrapRef.current.cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionInfo?.authenticated) {
      // The session disappeared — genuine sign-out/expiry, or a transient
      // failure the probe reports as unauthenticated. An in-flight bootstrap
      // must not keep acting, and the token must be RETIRED, not just
      // cancelled: if it stayed registered, the next authenticated probe
      // (e.g. after a network blip) would join a dead run and either hang
      // behind the spinner or unlock routes with nothing persisted.
      if (activeBootstrapRef.current) {
        activeBootstrapRef.current.cancelled = true
        activeBootstrapRef.current = null
        // The retired run's finally no longer owns this flag.
        // oxlint-disable-next-line react/react-compiler
        setSnapshot(prev => ({ ...prev, bootstrapRunning: false }))
      }
      return
    }
    if (consumedProbeRef.current === sessionInfo) return
    consumedProbeRef.current = sessionInfo

    const storedUserId = Storage.getCurrentUser().userId
    const sessionUser = sessionInfo.user
    const targetUserId = sessionUser?.userId ?? 0

    const active = activeBootstrapRef.current
    if (active) {
      if (probeCoveredByRun(active, sessionUser, storedUserId)) {
        // A joined probe carrying a profile is fresher than the run's own
        // in-flight getMe response — remember it so the run's completion
        // applies it (latest join wins).
        if (sessionUser !== undefined && sessionUser.userId !== 0) {
          active.pendingHydration = sessionUser
        }
        // Recording classification IS this effect's externally-visible work
        // for a joined probe (see ReconcilerSnapshot.classifiedProbe).
        // oxlint-disable-next-line react/react-compiler
        setSnapshot(prev => ({ ...prev, classifiedProbe: sessionInfo }))
        return
      }
      // A different identity appeared under an in-flight bootstrap — only an
      // unsupported cross-tab account switch produces this. Cancel and hard
      // reload: the fresh page load reconciles from scratch.
      active.cancelled = true
      // Redirect.reload, not Redirect.to(href): on a #fragment URL the href
      // assignment is a same-document navigation — nothing reloads, the
      // conflict is never classified, and the spinner never clears.
      Redirect.reload()
      return
    }

    if (probeNamesStoredUser(sessionUser, storedUserId)) {
      ensureCacheIdentity(cacheIdentityRef, queryClient, sessionUser.userId)
      // setUserRoleStatuses persists the user itself (utils.ts).
      setUserRoleStatuses(sessionUser, Storage)
      // Recorded in state → clean re-render off the refreshed profile (the
      // localStorage write above is invisible to React without it).
      // oxlint-disable-next-line react/react-compiler
      setSnapshot(prev => ({ ...prev, classifiedProbe: sessionInfo }))
      // The hydrate path reads the router location — it is live here, unlike
      // at run completion (see applyPendingHydration).
      if (tosExplicitlyRejected(sessionUser, location.pathname)) {
        navigate('/tos_acceptance')
      }
      return
    }

    // Full bootstrap: no local identity, a different user, or no profile.
    const token: ActiveBootstrap = { targetUserId, cancelled: false }
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
      latestJoinedProfile: () => token.pendingHydration,
      // Only the BFF probe can be authenticated without a user — the legacy
      // probe always mirrors storage (session.ts). That answer means
      // "unregistered": completeSignIn must go straight to registration, as
      // its usual getMe would hit the same upstream 401 the probe just saw
      // and the /duos-api proxy answers that by destroying the session.
      sessionReportsNoProfile: sessionUser === undefined,
    }).then(
      outcome => outcome,
      // An unexpected rejection is not a completion — treat like a failure so
      // pending hydration is discarded along with it.
      () => 'failed' as const,
    ).then((outcome) => {
      if (activeBootstrapRef.current !== token) return
      activeBootstrapRef.current = null
      // Apply the freshest profile a joined probe carried — but ONLY when the
      // run completed. A 'signed-out' run just cleared storage; re-populating
      // it here would resurrect a stale identity that survives the sign-out
      // reload. (Joins that landed before the run's persist/routing step were
      // already applied inside completeSignIn via latestJoinedProfile.)
      if (outcome === 'completed' && !token.cancelled && token.pendingHydration) {
        applyPendingHydration(token.pendingHydration, navigate)
      }
      // completeSignIn cleared and repopulated the cache under whatever
      // identity it persisted (the empty default after a signed-out run) —
      // that is who this tab's cache belongs to now.
      cacheIdentityRef.current = Storage.getCurrentUser().userId
      setSnapshot(prev => ({ ...prev, bootstrapRunning: false }))
    })
  }, [sessionInfo, navigate, location.pathname, location.search, queryClient])

  const isLoggedIn = sessionInfo?.authenticated ?? false
  // An unclassified probe hides identity-bearing UI unless it matches the
  // stored profile on every auth-relevant field — same user with changed
  // roles, DAC assignments, or status must not be committed off stale
  // storage, while a routine no-change revalidation must not blank the screen.
  const sessionUser = sessionInfo?.user
  const authEquivalent = sessionUser !== undefined && sessionUser.userId !== 0
    && authProfileEquivalent(sessionUser, Storage.getCurrentUser())
  const unclassifiedIdentityChange = sessionInfo !== snapshot.classifiedProbe && !authEquivalent
  // An in-flight first probe (sessionInfo undefined) reconciles too: rendering
  // the signed-out chrome to a signed-in user invites a click that starts a
  // sign-in flow (Home's library cards) or bounces a deep link. The cost is
  // one probe round-trip behind the spinner on a BFF hard load; the legacy
  // probe answers synchronously.
  const reconciling = sessionInfo === undefined
    || (isLoggedIn && (snapshot.bootstrapRunning || unclassifiedIdentityChange))

  return { sessionInfo, isLoggedIn, reconciling }
}
