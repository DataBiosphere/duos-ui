import React, { useEffect, useState } from 'react'
import { isEmpty, isNil } from 'lodash'
import { Alert } from 'src/components/Alert'
import { Auth } from 'src/libs/auth/auth'
import { User } from 'src/libs/ajax/User'
import { Metrics } from 'src/libs/ajax/Metrics'
import { Storage } from 'src/libs/storage'
import { Navigation, setUserRoleStatuses } from 'src/libs/utils'
import loadingIndicator from 'src/images/loading-indicator.svg'
import ReactTooltip from 'react-tooltip'
import eventList, { MetricsEventName } from 'src/libs/events'
import { StackdriverReporter } from 'src/libs/stackdriverReporter'
import { OidcUser } from 'src/libs/auth/oidcBroker'
import { DuosUser } from 'src/types/model'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'
import 'src/styles/tooltip.css'
import { useNavigate } from 'react-router-dom'

interface ErrorInfo {
  title?: string
  description?: string
  show?: boolean
  msg?: string
}

type ErrorDisplay = ErrorInfo | React.JSX.Element

interface HttpError extends Error {
  status?: number
  body?: ReadableStream<Uint8Array>
}

export const SignInButton = () => {
  const navigate = useNavigate()
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isConsentDown, setIsConsentDown] = useState<boolean>(false)
  const [isSamDown, setIsSamDown] = useState<boolean>(false)

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    // Check if the user has accepted ToS yet or not:
    const tosAccepted = Storage.getCurrentUser().userStatusInfo?.tosAccepted || false
    if (tosAccepted) {
      if (isNil(redirectPath)) {
        await Navigation.console(Storage.getCurrentUser(), navigate)
      }
      else {
        navigate(redirectPath)
      }
    }
    else {
      // User has authenticated, but has not accepted ToS
      if (isNil(redirectPath)) {
        navigate(`/tos_acceptance`)
      }
      else {
        navigate(`/tos_acceptance?redirectTo=${redirectPath}`)
      }
    }
  }

  const onSuccess = async (_: OidcUser) => {
    const redirectTo = getRedirectTo()
    const shouldRedirect = shouldRedirectTo(redirectTo)
    try {
      const duosUser: DuosUser = await User.getMe()
      if (duosUser) {
        Storage.setCurrentUser(duosUser)
        setUserRoleStatuses(duosUser, Storage)
        if (!duosUser.roles) {
          await StackdriverReporter.report('roles not found for user: ' + duosUser.email)
        }
        await syncSignInOrRegistrationEvent(eventList.userSignIn)
        await checkToSAndRedirect(shouldRedirect ? redirectTo : null)
      }
      else {
        await handleRegistration(redirectTo, shouldRedirect)
      }
    }
    catch (_error) {
      await handleRegistration(redirectTo, shouldRedirect)
    }
  }

  const getRedirectTo = (): string => {
    const queryParams = new URLSearchParams(window.location.search)
    return queryParams.get('redirectTo') || window.location.pathname
  }

  const shouldRedirectTo = (page: string): boolean => page !== '/' && page !== '/home'

  const handleRegistration = async (redirectTo: string, shouldRedirect: boolean) => {
    try {
      await registerAndRedirectNewUser(redirectTo, shouldRedirect)
    }
    catch (error) {
      await handleErrors(error as HttpError, redirectTo, shouldRedirect)
    }
  }

  const registerAndRedirectNewUser = async (redirectTo: string, shouldRedirect: boolean) => {
    const registeredUser: DuosUser = await User.registerUser()
    setUserRoleStatuses(registeredUser, Storage)
    await syncSignInOrRegistrationEvent(eventList.userRegister)
    navigate(`/tos_acceptance${shouldRedirect ? `?redirectTo=${redirectTo}` : ''}`)
  }

  const syncSignInOrRegistrationEvent = async (event: MetricsEventName) => {
    Storage.setAnonymousId()
    // noinspection ES6MissingAwait
    Metrics.identify(`${Storage.getAnonymousId()}`)
    // noinspection ES6MissingAwait
    Metrics.syncProfile()
    // noinspection ES6MissingAwait
    Metrics.captureEvent(event)
  }

  const errorStreamToString = async (error: HttpError) => {
    const body = await new Response(error.body).json()
    return body.message || JSON.stringify(body)
  }

  const handleServerError = async (error: HttpError) => {
    const errorMessage = await errorStreamToString(error)
    setErrorDisplay({ show: true, title: 'Error', description: errorMessage })
  }

  const handleErrors = async (error: HttpError, redirectTo: string, shouldRedirect: boolean) => {
    const status = error.status

    switch (status) {
      case 400:
        setErrorDisplay({ show: true, title: 'Error', description: JSON.stringify(error) })
        break
      case 409:
        await handleConflictError(redirectTo, shouldRedirect)
        break
      case 500:
        await handleServerError(error)
        break
      default:
        setErrorDisplay({ show: true, title: 'Error', description: 'Unexpected error, please try again' })
        break
    }
  }

  const handleConflictError = async (redirectTo: string, shouldRedirect: boolean) => {
    try {
      await checkToSAndRedirect(shouldRedirect ? redirectTo : null)
    }
    catch (_error) {
      await Auth.signOut()
    }
  }

  const onFailure = (response: Error) => {
    Storage.clearStorage()
    // Known error case from oidc-client-ts PopupWindow: "new Error("Popup closed by user")"
    if (response.toString().includes('Popup closed by user')) {
      setErrorDisplay(
        { title: 'Sign in cancelled', description: 'Sign in cancelled by closing the sign in window' })
    }
    else {
      setErrorDisplay({ title: 'Error', description: response.toString() })
    }
  }

  const loadingElement = (): React.JSX.Element => {
    return (
      <span>
        <img height="20px" src={loadingIndicator} alt="loading" />
      </span>
    )
  }

  const tooltipStyle: React.CSSProperties = { maxWidth: '30vw', textWrap: 'wrap' }

  useEffect(() => {
    const init = async () => {
      setIsConsentDown(!(await ServiceStatus.isConsentHealthy()))
      setIsSamDown(!(await ServiceStatus.isSamHealthy()))
    }
    init()
  }, [])

  const signInElement = (): React.JSX.Element => {
    return (
      <div style={{ display: 'flex', marginRight: 30 }}>
        <div
          data-tip="Full details"
          data-for="sam-disabled-sign-in-tooltip"
        >
          <button
            style={{
              height: 50,
              width: 200,
              fontSize: 18,
              fontWeight: 500,
              color: 'rgb(77, 114, 170)',
              borderRadius: 5,
            }}
            onClick={async () => {
              setIsLoading(true)
              Auth.signIn().then(onSuccess, onFailure)
              setIsLoading(false)
            }}
            disabled={isLoading || isConsentDown || isSamDown}
          >
            {isLoading ? loadingElement() : 'Sign In'}
          </button>
        </div>
        <ReactTooltip
          place="top"
          disable={!isConsentDown && !isSamDown}
          effect="solid"
          id="sam-disabled-sign-in-tooltip"
          className="interactiveTooltip"
          delayHide={1000}
        >
          <div style={tooltipStyle}>
            <span>
              DUOS is currently unavailable. Please check the
              <a href="status">status page</a>
              {' '}
              for more details.
            </span>
          </div>
        </ReactTooltip>
        <a
          className="navbar-duos-icon-help"
          style={{ color: 'white', height: 16, width: 16, marginLeft: 5 }}
          href="https://duos.blog/link_institutional_email_to_gmail/"
          data-for="tip_google-help"
          data-tip="Need account help? Click here!"
          aria-label="Need account help? Click here!"
        />
        <ReactTooltip id="tip_google-help" place="top" effect="solid" multiline={true} className="tooltip-wrapper" />
      </div>
    )
  }

  return (
    <div>
      {isEmpty(errorDisplay)
        ? (
            <div>
              {signInElement()}
            </div>
          )
        : (
            <div className="dialog-alert">
              <Alert
                id="dialog"
                type="danger"
                title={(errorDisplay as ErrorInfo).title || 'Error'}
                description={(errorDisplay as ErrorInfo).description || ''}
                onClose={() => setErrorDisplay({})}
              />
            </div>
          )}
    </div>
  )
}

export default SignInButton
