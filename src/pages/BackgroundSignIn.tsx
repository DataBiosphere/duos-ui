import React, { useState, useEffect } from 'react'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Navigation, setUserRoleStatuses } from 'src/libs/utils'
import { useNavigate, useLocation } from 'react-router'
import { SpinnerComponent } from 'src/components/SpinnerComponent'
import loadingImage from 'src/images/loading-indicator.svg'
import { DuosUser } from 'src/types/model'

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
  const [invalidToken, setInvalidToken] = useState(false)

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
      // BFF NOTE: the browser no longer holds tokens, so a pasted bearer token
      // cannot be attached to API calls — the BFF proxy injects the session's
      // token server-side and strips any client-supplied Authorization header.
      // This dev-only page now just probes /api/user/me with whatever session
      // exists; the e2e auth strategy that used it is revisited in Epic 6.
      getUser().then(
        (user) => {
          const enriched = Object.assign(user, setUserRoleStatuses(user, Storage))
          setLoading(false)
          redirect(enriched)
        },
        (error: { status?: number }) => {
          const status = error.status
          switch (status) {
            case 400:
              if (onError)
                onError(error)
              setLoading(false)
              break
            case 409:
              handle409()
              break
            case 401:
            default:
              setInvalidToken(true)
              setLoading(false)
              break
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
                  {invalidToken
                    && (
                      <div
                        style={{ backgroundColor: '#FCEDEB', color: '#D13B07' }}
                        className="col-lg-9 col-md-9 col-sm-9 col-xs-8 bold"
                      >
                        The provided token is invalid.
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
