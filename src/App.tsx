import React, { useEffect, useRef, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { NavigationStateProvider } from 'src/contexts/NavigationStateContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'src/App.css'
import { muiThemeFix } from 'src/libs/muiThemeFix'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { Config } from 'src/libs/config'
import DuosFooter from 'src/components/DuosFooter'
import DuosHeader from 'src/components/DuosHeader'
import { useNavigate, useLocation } from 'react-router'
import { Storage } from 'src/libs/storage'
import AppRoutes from 'src/routing/AppRoutes'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import { completeSignIn } from 'src/libs/auth/postSignIn'
import { useSessionInfo } from 'src/hooks/useSession'
import type { SessionInfo } from 'src/libs/auth/session'
import { extractError } from 'src/utils/ErrorUtils'
import { Spinner } from 'src/components/Spinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const [env, setEnv] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  // Auth state comes from the BFF session probe (GET /auth/me), not localStorage.
  const sessionInfo = useSessionInfo()
  const isLoggedIn = sessionInfo?.authenticated ?? false
  const [signInBootstrapDone, setSignInBootstrapDone] = useState(false)
  // State (render-visible) tracks that the bootstrap is underway; the ref is
  // only the effect's consumed-probe marker, never read during render.
  const [signInBootstrapStarted, setSignInBootstrapStarted] = useState(false)
  const consumedProbeRef = useRef<SessionInfo | null>(null)
  // The session identity and the locally stored profile can disagree: after a
  // session expires and someone signs in as a different account (or another
  // tab switches accounts on the shared cookie), CurrentUser still holds the
  // previous user. Render-visibly, only a session that NAMES a different user
  // counts — a session with no user is also what the cached probe looks like
  // right after registration persists the new profile. The effect below tells
  // those two apart by probe freshness (each probe result is classified once),
  // so a genuinely unregistered session still re-bootstraps. In legacy mode
  // the probe reports the stored user itself, so this can never fire there.
  const storedUserId = Storage.getCurrentUser().userId
  const sessionUserId = sessionInfo?.user?.userId
  const identityMismatch = isLoggedIn && storedUserId !== 0
    && sessionUserId !== undefined && sessionUserId !== storedUserId
  // A session with no local user state means we just returned from the OAuth
  // redirect — the routes stay hidden behind the spinner until the user
  // bootstrap below resolves. Once the bootstrap has started it stays "on"
  // until it settles: completeSignIn populates CurrentUser mid-flight, and the
  // userId check alone would reveal the routes before the ToS gate has routed.
  const isBootstrappingSignIn = isLoggedIn && !signInBootstrapDone
    && (signInBootstrapStarted || storedUserId === 0 || identityMismatch)

  // If the session identity changes after the bootstrap already ran (focus
  // revalidation caught another tab switching accounts), re-arm it so the
  // fresh completeSignIn overwrites the stale profile, resets the query
  // cache, and re-runs the ToS gate (adjust-state-during-render pattern).
  if (identityMismatch && signInBootstrapDone) {
    setSignInBootstrapStarted(false)
    setSignInBootstrapDone(false)
  }

  useEffect(() => {
    const setEnvironment = async () => {
      const environment = await Config.getEnv()
      setEnv(environment)
      Storage.setEnv(environment)
    }
    setEnvironment()
    // The environment never changes within a page load — look it up once on
    // mount instead of on every render.
  }, [])

  /**
   * Session reconciliation. Each FRESH probe result is classified exactly once
   * (the ref remembers the last consumed result object; the cached probe
   * returns the same object, so re-renders and StrictMode double-invocations
   * are no-ops):
   *
   * - Session names the stored user → hydrate: refresh the local profile from
   *   the probe's server-fetched user (roles/ToS can change between page
   *   loads — the popup flow used to reconcile on every sign-in) and route to
   *   the ToS gate if acceptance is missing. No metrics, no navigation churn.
   * - Anything else (no local user after the OAuth callback, a session naming
   *   a different user, or a fresh probe with no profile = unregistered — the
   *   cross-tab-switch case) → the full post-sign-in bootstrap.
   */
  useEffect(() => {
    if (!sessionInfo?.authenticated || consumedProbeRef.current === sessionInfo) return
    consumedProbeRef.current = sessionInfo

    const storedId = Storage.getCurrentUser().userId
    const sessionUser = sessionInfo.user
    if (sessionUser?.userId !== undefined && sessionUser.userId === storedId) {
      Storage.setCurrentUser(sessionUser)
      setUserRoleStatuses(sessionUser, Storage)
      // Only an explicit "not accepted" routes to the gate — a profile without
      // status info (older legacy sessions, service accounts) is left alone.
      const tosRejected = sessionUser.userStatusInfo?.tosAccepted === false
      const onTosPage = location.pathname.startsWith('/tos')
      if (tosRejected && !onTosPage) {
        navigate('/tos_acceptance')
      }
      return
    }

    // Arm the spinner in the same tick the bootstrap kicks off — deliberate:
    // the effect's real work is the external completeSignIn call below, and
    // these flags are how the render layer tracks it.
    // oxlint-disable-next-line react/react-compiler
    setSignInBootstrapStarted(true)
    // oxlint-disable-next-line react/react-compiler
    setSignInBootstrapDone(false)
    // The BFF callback lands the browser on the destination itself, so the
    // pathname is the redirect target; the legacy popup flow reloads on the
    // landing page with the destination still in ?redirectTo=.
    const redirectTo = new URLSearchParams(location.search).get('redirectTo')
    completeSignIn({ navigate, queryClient, redirectPath: redirectTo ?? location.pathname })
      .finally(() => setSignInBootstrapDone(true))
  }, [sessionInfo, navigate, location.pathname, location.search])

  /**
     * Check for RAS Authentication URL params. If we have a code and state, we will call ECM APIs to get redirect
     * information and user linkage information. With that, we can sync the users account linkage and then redirect the
     * user to the original page they authenticated from.
     */
  useEffect(() => {
    const checkRASAuthentication = async () => {
      const queryParams = new URLSearchParams(location.search)
      const code = queryParams.get('code')
      const state = queryParams.get('state')
      // These parameters indicate a successful RAS authentication.
      if (code && state) {
        setIsLoading(true)
        try {
          const linkInfo = await AuthenticateNIH.getECMProviderLinkInfo(code, state)
          const duosUser = await AuthenticateNIH.getSyncedUser()
          // After account linking, we need to refresh the locally saved user.
          Storage.setCurrentUser(duosUser)
          setUserRoleStatuses(duosUser, Storage)
          if (linkInfo?.additionalState?.redirectTo) {
            // The redirectTo URL is expected to be a full URL, so we need to remove the origin part
            // to use navigate for the redirect.
            navigate(linkInfo.additionalState.redirectTo.replace(globalThis.location.origin, ''))
          }
        }
        catch (error) {
          Notifications.showError({
            text: 'Error during RAS authentication: ' + extractError(error),
            description: 'There was an error processing your RAS authentication. Please try again.',
          })
        }
        finally {
          setIsLoading(false)
        }
      }
    }
    checkRASAuthentication()
  }, [navigate, location.search])

  const loadingSyle = {
    position: 'fixed',
    top: '45%',
    left: '45%',
  } as React.CSSProperties
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={muiThemeFix}>
        <NavigationStateProvider>
          <div className="body">
            <div className="wrap">
              <div className="main">
                <DuosHeader />
                {(isLoading || isBootstrappingSignIn) && <div style={loadingSyle}><Spinner /></div>}
                {!(isLoading || isBootstrappingSignIn) && <AppRoutes isLogged={isLoggedIn} env={env} />}
              </div>
            </div>
            <DuosFooter />
          </div>
        </NavigationStateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
