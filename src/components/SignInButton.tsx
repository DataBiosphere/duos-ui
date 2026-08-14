import React, { useEffect, useState } from 'react'
import { isEmpty } from 'src/utils/NodashUtil'
import { Alert } from 'src/components/Alert'
import { Auth, Redirect } from 'src/libs/auth/auth'
import loadingIndicator from 'src/images/loading-indicator.svg'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { ServiceStatus } from 'src/libs/ajax/ServiceStatus'
import 'src/styles/tooltip.css'

interface ErrorInfo {
  title?: string
  description?: string
  show?: boolean
  msg?: string
}

type ErrorDisplay = ErrorInfo | React.JSX.Element

/**
 * A single sign-in button that starts the BFF login flow: POST /auth/login
 * returns the B2C authorization URL and the whole page redirects there. The
 * B2C login page presents the provider choice (Google / Microsoft), so no
 * provider selection happens here. After B2C, the server-side /auth/callback
 * establishes the session and redirects back; App.tsx's post-sign-in bootstrap
 * takes it from there (user fetch, registration, ToS gate).
 */
export const SignInButton = () => {
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isConsentDown, setIsConsentDown] = useState<boolean>(false)
  const [isSamDown, setIsSamDown] = useState<boolean>(false)
  const [isButtonActive, setIsButtonActive] = useState<boolean>(false)

  const getRedirectTo = (): string => {
    const queryParams = new URLSearchParams(globalThis.location.search)
    return queryParams.get('redirectTo') || globalThis.location.pathname
  }

  const shouldRedirectTo = (page: string): boolean => page !== '/' && page !== '/home'

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      const redirectTo = getRedirectTo()
      await Auth.signIn(shouldRedirectTo(redirectTo) ? redirectTo : undefined)
      // In BFF mode Auth.signIn navigates the page to B2C and never resolves —
      // the spinner stays up until the browser leaves. Only the legacy popup
      // flow reaches this line: reload in place (query string included) so the
      // fresh page load re-probes auth state and App.tsx runs the post-sign-in
      // bootstrap, the same path the BFF callback takes.
      Redirect.to(globalThis.location.href)
    }
    catch {
      setErrorDisplay({ show: true, title: 'Error', description: Auth.signInError() })
      setIsLoading(false)
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
  const isSignInDisabled = isLoading || isConsentDown || isSamDown
  const signInButtonStyle: React.CSSProperties = {
    height: 50,
    width: 200,
    fontSize: 18,
    fontWeight: 500,
    color: '#fff',
    background: isButtonActive && !isSignInDisabled ? '#005d9a' : 'transparent',
    border: '2px solid #fff',
    borderRadius: 5,
    cursor: isSignInDisabled ? 'not-allowed' : 'pointer',
    opacity: isSignInDisabled ? 0.55 : 1,
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  }

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
          data-tooltip-id="sam-disabled-sign-in-tooltip"
        >
          <button
            style={signInButtonStyle}
            onMouseEnter={() => setIsButtonActive(true)}
            onMouseLeave={() => setIsButtonActive(false)}
            onFocus={() => setIsButtonActive(true)}
            onBlur={() => setIsButtonActive(false)}
            onClick={() => {
              void handleSignIn()
            }}
            disabled={isSignInDisabled}
          >
            {isLoading ? loadingElement() : 'Sign In'}
          </button>
        </div>
        {(isConsentDown || isSamDown)
          ? (
              <ReactTooltip
                place="top"
                id="sam-disabled-sign-in-tooltip"
                className="interactiveTooltip"
                delayHide={1000}
              >
                <div style={tooltipStyle}>
                  <span>
                    DUOS is currently unavailable. Please check the
                    {' '}
                    <a href="status">status page</a>
                    {' '}
                    for more details.
                  </span>
                </div>
              </ReactTooltip>
            )
          : null}
        <a
          className="navbar-duos-icon-help"
          style={{ color: 'white', height: 16, width: 16, marginLeft: 5 }}
          href="https://duos.blog/link_institutional_email_to_gmail/"
          data-tooltip-id="tip_google-help"
          data-tooltip-content="Need account help? Click here!"
          aria-label="Need account help? Click here!"
        />
        <ReactTooltip id="tip_google-help" place="top" className="tooltip-wrapper" />
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
