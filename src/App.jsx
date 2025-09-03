import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import Modal from 'react-modal'
import 'src/App.css'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH.js'
import { Config } from 'src/libs/config'
import DuosFooter from 'src/components/DuosFooter'
import DuosHeader from 'src/components/DuosHeader'
import { useHistory, useLocation } from 'react-router-dom'
import { StackdriverReporter } from 'src/libs/stackdriverReporter'
import { Storage } from 'src/libs/storage'
import Routes from 'src/Routes'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { Spinner } from 'src/components/Spinner'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [env, setEnv] = useState('')
  const history = useHistory()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  const trackPageView = (location) => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search })
  }

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
    const initializeReactGA = async (history) => {
      const gaId = await Config.getGAId()
      ReactGA.initialize(gaId, {
        titleCase: false,
      })
      // call trackPageView to register initial page load
      trackPageView(location)
      // pass trackPageView as callback function for url change listener
      history.listen(trackPageView)
    }
    initializeReactGA(history)
  }, [history, location])

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
            // to use history.push for the redirect.
            history.push(linkInfo.additionalState.redirectTo.replace(window.location.origin, ''))
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
  }, [history, location.search])

  const loadingSyle = {
    position: 'fixed',
    top: '45%',
    left: '45%',
  }
  return (
    <div className="body">
      <div className="wrap">
        <div className="main">
          <DuosHeader />
          {isLoading && <div style={loadingSyle}><Spinner /></div>}
          {!isLoading && <Routes isLogged={isLoggedIn} env={env} />}
        </div>
      </div>
      <DuosFooter />
    </div>
  )
}

export default App
