import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import Modal from 'react-modal'
import 'src/App.css'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH.js'
import { Config } from 'src/libs/config'
import DuosFooter from 'src/components/DuosFooter'
import DuosHeader from 'src/components/DuosHeader'
import { useNavigate, useLocation } from 'react-router-dom'
import { StackdriverReporter } from 'src/libs/stackdriverReporter'
import { Storage } from 'src/libs/storage'
import AppRoutes from 'src/routing/AppRoutes'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { Spinner } from 'src/components/Spinner'
import { CookeUtils } from 'src/utils/CookieUtils'

export function GAListener() {
  const location = useLocation()
  if (CookeUtils.getAnalyticsControl()) {
    console.log('Logging pageview for ', location.pathname + location.search)
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search })
  }
  return null
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [env, setEnv] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    Modal.setAppElement(document.getElementById('modal-root'))
  })

  useEffect(() => {
    const setEnvironment = async () => {
      const environment = await Config.getEnv()
      setEnv(environment)
      Storage.setEnv(environment)
    }
    setEnvironment()
  })

  useEffect(() => {
    const initializeReactGA = async () => {
      const gaId = await Config.getGAId()
      if (CookeUtils.getAnalyticsControl()) {
        ReactGA.initialize(gaId, {
          titleCase: false,
        })
      }
    }
    initializeReactGA()
  }, [])

  useEffect(() => {
    const stackdriverStart = async () => {
      await StackdriverReporter.start()
    }
    stackdriverStart()
  }, [])

  useEffect(() => {
    const setUserIsLogged = () => {
      const isLogged = Storage.userIsLogged()
      setIsLoggedIn(isLogged)
    }
    setUserIsLogged()
  })

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
            navigate(linkInfo.additionalState.redirectTo.replace(window.location.origin, ''))
          }
        }
        catch (error) {
          Notifications.showError({
            message: 'Error during RAS authentication: ' + extractError(error),
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
  }
  return (
    <div className="body">
      <div className="wrap">
        <div className="main">
          <GAListener />
          <DuosHeader />
          {isLoading && <div style={loadingSyle}><Spinner /></div>}
          {!isLoading && <AppRoutes isLogged={isLoggedIn} env={env} />}
        </div>
      </div>
      <DuosFooter />
    </div>
  )
}

export default App
