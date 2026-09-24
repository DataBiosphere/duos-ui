import React, { useState, useEffect } from 'react'
import { User } from 'src/libs/ajax/User'
import { isBffEnabled } from 'src/libs/config'
import type { OidcUser } from 'src/libs/auth/oidcBroker'
import { Storage } from 'src/libs/storage'
import { Navigation, setUserRoleStatuses } from 'src/libs/utils'
import { useNavigate, useLocation } from 'react-router'
import { SpinnerComponent } from 'src/components/SpinnerComponent'
import loadingImage from 'src/images/loading-indicator.svg'
import { resetSessionCache } from 'src/libs/auth/session'
import { resetCsrfToken } from 'src/libs/ajax/csrf'
import { DuosUser } from 'src/types/model'
import { extractStatus } from 'src/utils/ErrorUtils'

export interface BackgroundSignInProps {
  onSignIn?: () => void
  onError?: (error: { status?: number }) => void
  bearerToken?: string
  isLogged?: boolean
  env?: string
}

export default function BackgroundSignIn({ onSignIn, onError, bearerToken }: Readonly<BackgroundSignInProps>) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const token = bearerToken ?? (queryParams.get('token') ?? '')
  const [loading, setLoading] = useState(token !== '')
  const [accessToken, setAccessToken] = useState(token)
  const [formToken, setFormToken] = useState(token)
  const [signInError, setSignInError] = useState('')

  useEffect(() => {
    const getUser = async (): Promise<DuosUser> => {
      return await User.getMe()
    }

    const redirect = (user: DuosUser) => {
      Navigation.console(user, navigate)
      if (onSignIn)
        onSignIn()
    }

    const handle409 = () => {
      getUser().then(
        (user) => {
          const enriched = Object.assign(user, setUserRoleStatuses(user, Storage))
          redirect(enriched)
          setLoading(false)
        },
        () => {
          Storage.clearStorage()
          setLoading(false)
        })
    }

    const performLogin = () => {
      setLoading(true)
      setSignInError('')
      const signIn = async () => {
        if (await isBffEnabled()) {
          const response = await fetch('/auth/test-signin', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          })
          if (response.status !== 204) {
            throw Object.assign(new Error('Background sign-in failed'), { status: response.status })
          }
          resetCsrfToken()
        }
        else {
          // Preserve the legacy harness until BFF cutover. The opaque Google
          // token has no readable expiry; retain the existing one-hour estimate.
          const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600
          Storage.setOidcUser({ id_token: accessToken, profile: { exp: oneHourFromNow } } as unknown as OidcUser)
        }
        resetSessionCache()
        return getUser()
      }
      signIn().then(
        (user) => {
          const enriched = Object.assign(user, setUserRoleStatuses(user, Storage))
          setLoading(false)
          redirect(enriched)
        },
        (error: { status?: number }) => {
          // The fetch adapter throws `response.status`; the test-signin POST above throws `status`.
          const status = extractStatus(error) ?? error.status
          switch (status) {
            case 400:
              if (onError)
                onError(error)
              setLoading(false)
              break
            case 409:
              handle409()
              break
            case 429:
              setSignInError('Too many sign-in attempts. Please wait a minute and try again.')
              setLoading(false)
              break
            case 401:
              setSignInError('The provided token is invalid.')
              setLoading(false)
              break
            case 200:
            case 404:
              // The BFF registers /auth/test-signin only when the fixture is enabled
              // (DT-4068). The route itself answers 204, so a 200 is the SPA
              // not-found fallback serving index.html for the unregistered path.
              setSignInError('Background sign-in is not enabled on this server. Set DUOS_TEST_SIGNIN_ENABLED and DUOS_TEST_SIGNIN_EMAILS, then restart it.')
              setLoading(false)
              break
            default: {
              // A 5xx or network failure is the server or an upstream, not the token.
              const httpStatus = status ? ' (HTTP ' + status + ')' : ''
              setSignInError('Sign-in failed' + httpStatus + '. The server or one of its upstream services is unavailable.')
              setLoading(false)
              break
            }
          }
        })
    }

    if (accessToken)
      performLogin()
  }, [accessToken, navigate, onError, onSignIn])

  return (
    <div>
      {loading
        ? (
            <div>
              <SpinnerComponent loadingImage={loadingImage} />
            </div>
          )
        : (
            <form
              name="accessTokenForm"
              encType="multipart/form-data"
              onSubmit={(e) => {
                e.preventDefault()
                setAccessToken(formToken)
              }}
            >
              <div className="form-group">
                <div className="col-lg-9 col-lg-offset-3 col-md-9 col-lg-offset-3 col-sm-9 col-lg-offset-3 col-xs-8 col-lg-offset-4 bold">
                  {signInError
                    && (
                      <div
                        style={{ backgroundColor: '#FCEDEB', color: '#D13B07' }}
                        className="col-lg-9 col-md-9 col-sm-9 col-xs-8 bold"
                      >
                        {signInError}
                      </div>
                    )}
                  <br />
                  <div id="lbl_accessToken" className="common-color">
                    Access Token
                  </div>
                  <div>
                    <textarea
                      name="accessToken"
                      className="form-control"
                      style={{ maxWidth: '50%' }}
                      autoFocus={true}
                      value={formToken}
                      onChange={(e) => {
                        setFormToken(e.target.value)
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="submit"
                      className="col-lg-8 col-md-8 col-sm-12 col-xs-12 btn-primary btn"
                      style={{ marginTop: '5px', maxWidth: '50%' }}
                      value="Submit"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
    </div>
  )
}
