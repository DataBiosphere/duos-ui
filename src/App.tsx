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
import { useUserIsLogged } from 'src/hooks/useSession'
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
  const isLoggedIn = useUserIsLogged() ?? false
  const [signInBootstrapDone, setSignInBootstrapDone] = useState(false)
  // State (render-visible) tracks that the bootstrap is underway; the ref is
  // only the effect's run-once guard, never read during render.
  const [signInBootstrapStarted, setSignInBootstrapStarted] = useState(false)
  const signInBootstrapKickedOff = useRef(false)
  // A session with no local user state means we just returned from the OAuth
  // redirect — the routes stay hidden behind the spinner until the user
  // bootstrap below resolves. Once the bootstrap has started it stays "on"
  // until it settles: completeSignIn populates CurrentUser mid-flight, and the
  // userId check alone would reveal the routes before the ToS gate has routed.
  const isBootstrappingSignIn = isLoggedIn && !signInBootstrapDone
    && (signInBootstrapStarted || Storage.getCurrentUser().userId === 0)

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
   * Post-sign-in bootstrap: the OAuth flow is a full-page redirect through the
   * BFF (/auth/login → B2C → /auth/callback → back here), so the first render
   * after signing in has a session but no local user state. Detect that and
   * run the user fetch / registration / ToS flow.
   */
  useEffect(() => {
    if (!isBootstrappingSignIn || signInBootstrapKickedOff.current) return
    signInBootstrapKickedOff.current = true
    setSignInBootstrapStarted(true)
    // The BFF callback lands the browser on the destination itself, so the
    // pathname is the redirect target; the legacy popup flow reloads on the
    // landing page with the destination still in ?redirectTo=.
    const redirectTo = new URLSearchParams(location.search).get('redirectTo')
    completeSignIn({ navigate, queryClient, redirectPath: redirectTo ?? location.pathname })
      .finally(() => setSignInBootstrapDone(true))
  }, [isBootstrappingSignIn, navigate, location.pathname, location.search])

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
