import React, { useEffect, useState } from 'react'
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
import { useSessionReconciler } from 'src/hooks/useSessionReconciler'
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
  // Auth state comes from the BFF session probe (GET /auth/me), not
  // localStorage. The reconciler classifies every fresh probe (hydrate the
  // stored profile, or run the full post-sign-in bootstrap) and reports when
  // the routes must stay hidden — see useSessionReconciler for the rules.
  const { isLoggedIn, reconciling } = useSessionReconciler(queryClient)

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
   * The BFF /auth/callback lands here when it cannot finish the sign-in, because the callback is a top-level browser
   * navigation and a JSON error body would strand the user on it. Two markers:
   *
   * - `provider` — B2C answered the authorization request with an error instead of a code. The known case is B2C
   *   failing to connect to the chosen Microsoft provider (an expired federation client secret in the tenant fails
   *   every Microsoft sign-in). The message stays generic because the cause is on the provider side — the server log
   *   carries the B2C error and description.
   * - `rate_limited` — the callback's flood control rejected the request (Phase 5, story 5-G3). Retrying works, so the
   *   message says so instead of pointing at the provider or at support.
   */
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const marker = queryParams.get('signInError')
    if (marker === null) return
    Notifications.showError({
      text: marker === 'rate_limited'
        ? 'Sign in could not be completed because too many sign-in attempts arrived at once. Please wait a minute and try again.'
        : 'Sign in could not be completed because the identity provider reported an error. '
          + 'Please try again. If the problem continues, contact DUOS support.',
      // Long timeout: the message carries instructions the user must read.
      timeout: 30000,
    })
    queryParams.delete('signInError')
    navigate({ pathname: location.pathname, search: queryParams.toString() }, { replace: true })
  }, [navigate, location.pathname, location.search])

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
                {/* The header derives role tabs and the profile menu from
                    Storage.getCurrentUser() — it is identity-bearing UI and
                    must hide during reconciliation like the routes do. */}
                {!reconciling && <DuosHeader />}
                {(isLoading || reconciling) && <div style={loadingSyle}><Spinner /></div>}
                {!(isLoading || reconciling) && <AppRoutes isLogged={isLoggedIn} env={env} />}
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
