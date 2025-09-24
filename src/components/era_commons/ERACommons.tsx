import React, { useEffect, useState } from 'react'
import { isNil } from 'lodash/fp'
import queryString from 'query-string'
import './ERACommons.css'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { User } from 'src/libs/ajax/User'
import { Config } from 'src/libs/config'
import '../Animations.css'
import { Storage } from 'src/libs/storage'
import { decodeNihToken } from 'src/utils/ERACommonsUtils'
import { extractEraAuthenticationState, nihAccountLabel, rasEnabled } from 'src/components/era_commons/ERACommonsUtils'

import ReactTooltip from 'react-tooltip'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { DuosUser } from 'src/types/model'

// -------------------- Types --------------------

interface ERACommonsProps {
  onNihStatusUpdate: (status: boolean) => void
  header?: boolean
  required?: boolean
  destination?: string
  researcherProfile?: DuosUser
  location?: {
    search?: string
  }
  validationError?: boolean
}

interface DecodedNihToken {
  eraCommonsUsername: string
  exp: string
}

// -------------------- Component --------------------

export default function ERACommons({
  onNihStatusUpdate,
  header = false,
  required = false,
  destination = '',
  researcherProfile,
  location,
  validationError = false,
}: Readonly<ERACommonsProps>) {
  const [search, setSearch] = useState<string>(location?.search || '')
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [expirationCount, setExpirationCount] = useState<number>(0)
  const [eraCommonsId, setEraCommonsId] = useState<string | undefined>('')
  const [nihError, setNihError] = useState<string | undefined>(undefined)

  const accountLabel = nihAccountLabel()
  const currentUser = Storage.getCurrentUser()

  // -------------------- Effects --------------------

  // On redirect back from NIH login
  useEffect(() => {
    const initEraAuthSuccess = async () => {
      if (search !== '') {
        const rawToken = queryString.parse(search)
        const decodedToken: DecodedNihToken | null = await decodeNihToken(rawToken)
        if (isNil(decodedToken)) {
          displayError(
            'The system received an invalid token, please try again or submit an error report using the "Contact Us" form.',
          )
          return
        }

        const nihPayload = {
          linkedNihUsername: `${decodedToken.eraCommonsUsername}`,
          linkExpireTime: `${decodedToken.exp}`,
          status: true,
        }

        const newUserProps = await AuthenticateNIH.saveNihUsr(nihPayload)
        const eraAuthState = extractEraAuthenticationState({
          properties: newUserProps,
          eraCommonsId: decodedToken.eraCommonsUsername,
        } as DuosUser)

        setIsAuthorized(eraAuthState.isAuthorized)
        setExpirationCount(eraAuthState.expirationCount)
        setEraCommonsId(eraAuthState.eraCommonsId)
        onNihStatusUpdate(eraAuthState.nihValid)

        document.getElementById('era-commons-id')?.scrollIntoView({
          block: 'start',
          inline: 'nearest',
          behavior: 'smooth',
        })
      }
    }

    initEraAuthSuccess()
  }, [onNihStatusUpdate, search])

  // Populate state from researcherProfile or current user
  useEffect(() => {
    const initResearcherProfile = async () => {
      const user = researcherProfile || await User.getMe()
      const eraAuthState = extractEraAuthenticationState(user as unknown as DuosUser)

      setIsAuthorized(eraAuthState.isAuthorized)
      setExpirationCount(eraAuthState.expirationCount)
      setEraCommonsId(eraAuthState.eraCommonsId)
      onNihStatusUpdate(eraAuthState.nihValid)
    }
    initResearcherProfile()
  }, [researcherProfile, onNihStatusUpdate])

  // -------------------- Handlers --------------------

  const redirectToNihLogin = async () => {
    const returnUrl = `${window.location.origin}/${destination}?nih-username-token=<token>`
    window.location.href = `${await Config.getNihUrl()}?${queryString.stringify({
      'return-url': returnUrl,
    })}`
  }

  const redirectToECMAuthUrl = async () => {
    const origin = window.location.origin
    const redirectTo = `${origin}/${destination}`
    try {
      window.location.href = await AuthenticateNIH.getECMProviderAuthUrl(origin, redirectTo)
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    catch (error: never) {
      const errorMessage = 'Error from Authentication Provider: ' + error?.response?.data?.message + ': ' + currentUser.email
      displayError(errorMessage)
    }
  }

  const deleteNihAccount = async () => {
    try {
      await AuthenticateNIH.deleteAccountLinkage()
      const response = await User.getMe()
      const eraAuthState = extractEraAuthenticationState(response.properties as unknown as DuosUser)

      setIsAuthorized(eraAuthState.isAuthorized)
      setExpirationCount(eraAuthState.expirationCount)
      setEraCommonsId('')
      onNihStatusUpdate(eraAuthState.nihValid)
      setSearch('')
    }
    catch {
      displayError(
        'Something went wrong removing your account, please submit an error report using the "Contact Us" form.',
      )
    }
  }

  const displayError = (message: unknown) => {
    setNihError(message as string)
    document.getElementById('era-commons-id')?.scrollIntoView({
      block: 'start',
      inline: 'nearest',
      behavior: 'smooth',
    })
  }

  // -------------------- Render --------------------

  return (
    <div id="era-commons-id" style={{ minHeight: 65 }}>
      {header && (
        <label className="era-control-label">
          <span data-cy="era-commons-header">
            NIH {accountLabel} ID
            {required ? <span data-cy="era-commons-required">*</span> : ''}
          </span>
        </label>
      )}

      {(!isAuthorized || expirationCount < 0) && (
        <a
          data-cy="era-commons-authenticate-link"
          className={validationError ? 'era-button-state-error' : 'era-button-state'}
          onClick={rasEnabled() ? redirectToECMAuthUrl : redirectToNihLogin}
          target="_blank"
        >
          <div className={rasEnabled() ? 'nih-logo-style' : 'era-logo-style'} />
          <span style={{ verticalAlign: '40%' }}>Authenticate your account</span>
        </a>
      )}

      {nihError && (
        <span data-cy="era-commons-error-span" className="era-cancel-color era-required-field-error-span">
          {nihError}
        </span>
      )}

      {isAuthorized && (
        <div>
          {expirationCount >= 0 && (
            <div className="era-commons-id-value">
              <span data-cy="era-commons-id-value">{eraCommonsId}</span>
              <AsyncSpinnerButton
                className="era-delete-icon"
                onClick={deleteNihAccount}
                onError={displayError}
                data-cy="era-delete-icon"
                style={{
                  cursor: 'pointer',
                  color: '#333',
                  backgroundColor: 'white',
                  border: 'none',
                  padding: '0',
                  minWidth: '10px',
                }}
              >
                <span
                  className="glyphicon glyphicon-remove-circle"
                  data-tip="Clear account"
                  data-for="tip_clear_era_commons_link"
                />
              </AsyncSpinnerButton>
              <ReactTooltip place="right" effect="solid" id="tip_clear_era_commons_link">
                Clear {accountLabel} Account Link.
                <br />
                This will <strong>remove</strong> your {accountLabel} account link from your profile and will be
                reflected both in <strong>DUOS</strong> and in <strong>Terra</strong>.
                <br />
                You can re-authenticate at any time.
              </ReactTooltip>
            </div>
          )}

          <div className="era-expiration-value">
            {expirationCount >= 0
              ? (
                  <div className="era-fadein">{`Your NIH authentication will expire in ${expirationCount} days`}</div>
                )
              : (
                  <div className="era-fadein">Your NIH authentication has expired</div>
                )}
          </div>
        </div>
      )}
    </div>
  )
}
