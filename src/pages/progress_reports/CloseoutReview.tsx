import React, { useEffect, useState } from 'react'
import InfoIcon from '@mui/icons-material/Info'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'
import { Storage } from 'src/libs/storage'
import { DAR } from 'src/libs/ajax/DAR'
import { AxiosError } from 'axios'
import { DataAccessRequest } from 'src/types/model'
import { AsyncSpinnerButton } from 'src/components/AsyncSpinnerButton'

interface CloseoutReviewProps {
  dar: DataAccessRequest
  onReturn?: () => void
}

export const CloseoutReview: React.FC<CloseoutReviewProps> = ({
  dar, onReturn,
}) => {
  const [acknowledged, setAcknowledged] = useState<boolean | undefined>(undefined)

  const onApprove = async (): Promise<void> => {
    const user = Storage.getCurrentUser()
    const isCloseoutApproved = dar.closeoutSigningOfficialApprovedDate !== undefined

    if (user.isSigningOfficial && !isCloseoutApproved) {
      await DAR.approveCloseout(dar.referenceId)
    }
    else {
      const acknowledgement = 'dar_closeout_chair_ref_' + dar.referenceId
      await User.acceptAcknowledgments(acknowledgement)
    }
    setAcknowledged(true)
    Notifications.showSuccess({ text: 'Closeout review approved successfully.' })
  }

  const onError = (error: unknown) => {
    setAcknowledged(false)
    const err = error as AxiosError<Record<string, string>>
    const message = err.response?.data.message
    Notifications.showError({ text: 'Error approving closeout review: ' + message })
  }

  // Required to get Chairperson acknowledgments of closeouts
  useEffect(() => {
    // Fetch the acknowledgement for the given referenceId
    const fetchAcknowledgement = async () => {
      try {
        const key = `dar_closeout_chair_ref_${dar.referenceId}`
        const chairAcknowledgement = await User.getAcknowledgement(key)
        if (chairAcknowledgement) {
          setAcknowledged(true)
        }
      }
      catch (error) {
        const consentError = extractConsentError(error)
        if (consentError && consentError.code === 404) {
          // 404 indicates no acknowledgement found, which is not an error
        }
        else {
          Notifications.showError({ text: 'Error: Unable to retrieve chairperson acknowledgement: ' + extractError(error) })
        }
      }
    }
    fetchAcknowledgement()
  }, [dar])

  return (
    <div
      className="progress-report-step-card"
      style={{
        border: '1px solid #4D72AA',
        borderRadius: '4px',
        padding: '24px',
        marginTop: '20px',
      }}
      data-cy="closeout-review"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <InfoIcon style={{
          color: '#4D72AA',
          fontSize: '24px',
          flexShrink: 0,
        }}
        />

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0,
              color: '#333F52',
              fontSize: '14px',
              lineHeight: '1.4',
              fontWeight: 'bold',
            }}
            >
              Please note:
            </p>
            <p style={{
              margin: '4px 0 0 0',
              color: '#333F52',
              fontSize: '14px',
              lineHeight: '1.4',
            }}
            >
              If there are issues with the content in this closeout report, please contact the researcher.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
            {/* Hide the Approve button if there is no closeout acknowledgement */}
            {(!acknowledged)
              && (
                <AsyncSpinnerButton
                  onClick={onApprove}
                  onError={onError}
                  data-cy="closeout-review-approve-button"
                  style={{
                    backgroundColor: '#4D72AA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    minWidth: '136px',
                  }}
                >
                  Approve closeout
                </AsyncSpinnerButton>
              )}
            <button
              type="button"
              onClick={onReturn}
              style={{
                backgroundColor: 'white',
                color: '#4D72AA',
                border: '1px solid #4D72AA',
                borderRadius: '4px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '183px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f7fa'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f7fa'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Go to DAR Requests
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
