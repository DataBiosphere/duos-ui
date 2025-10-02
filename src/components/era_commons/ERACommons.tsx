import React, { useEffect, useState } from 'react'
import './ERACommons.css'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { User } from 'src/libs/ajax/User'
import '../Animations.css'
import { Storage } from 'src/libs/storage'
import { extractEraAuthenticationState, nihAccountLabel } from 'src/components/era_commons/ERACommonsUtils'

import ReactTooltip from 'react-tooltip'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { DuosUser } from 'src/types/model'

// -------------------- Types --------------------

interface ERACommonsProps {
  onNihStatusUpdate: (valid: boolean) => void | undefined
  nihValid?: boolean
  header?: boolean
  required?: boolean
  destination?: string
  researcherProfile?: DuosUser
  validationError?: boolean
}

// -------------------- Component --------------------

export default function ERACommons({
  onNihStatusUpdate,
  header = false,
  required = false,
  destination = '',
  researcherProfile,
  validationError = false,
}: Readonly<ERACommonsProps>) {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [expirationCount, setExpirationCount] = useState<number>(0)
  const [eraCommonsId, setEraCommonsId] = useState<string | undefined>('')
  const [nihError, setNihError] = useState<string | undefined>(undefined)

  const accountLabel = nihAccountLabel()
  const currentUser = Storage.getCurrentUser()

  // -------------------- Effects --------------------

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

  const redirectToECMAuthUrl = async () => {
    const origin = window.location.origin
    const redirectTo = `${origin}/${destination}`
    try {
      window.location.href = await AuthenticateNIH.getECMProviderAuthUrl(origin, redirectTo)
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    catch (error: never) {
      const userEmail = currentUser?.email || 'unknown user'
      const errorMessage = 'Error from Authentication Provider: ' + error?.response?.data?.message + ': ' + userEmail
      displayError(errorMessage)
    }
  }

  const deleteNihAccount = async () => {
    try {
      await AuthenticateNIH.deleteAccountLinkage()
      const response = await User.getMe()
      const eraAuthState = extractEraAuthenticationState(response as DuosUser)
      setIsAuthorized(eraAuthState.isAuthorized)
      setExpirationCount(eraAuthState.expirationCount)
      setEraCommonsId('')
      onNihStatusUpdate(eraAuthState.nihValid)
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
          onClick={redirectToECMAuthUrl}
          target="_blank"
        >
          <div className="nih-logo-style" />
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
