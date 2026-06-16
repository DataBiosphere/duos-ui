import React from 'react'
import { ProgressReport } from 'src/libs/ajax/ProgressReport'
import { Notifications } from 'src/libs/utils'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { CombinedDataAccessRequest } from 'src/types/model'
import { convertFormStateToDAR } from 'src/utils/DarUtils'
import { extractError } from 'src/utils/ErrorUtils'
import { DAR } from 'src/libs/ajax/DAR'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'

interface SubmitProgressReportProps {
  readonly formState: FormState
  readonly parentReferenceId: string
  readonly onSuccess: (result: unknown) => void
  readonly onCancel: () => void
  readonly isValid?: boolean
  readonly onValidate?: () => void
  readonly uploadedIrbDocument?: File | null
  readonly parentDar?: CombinedDataAccessRequest
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const { formState, parentReferenceId, onSuccess, onCancel, isValid, onValidate, uploadedIrbDocument, parentDar } = props

  const submit = async () => {
    try {
      let irbDocumentToSubmit = uploadedIrbDocument

      // If no new IRB document was uploaded, but parent DAR has an IRB document, use that
      if (!uploadedIrbDocument && parentDar?.irbDocumentLocation && parentDar?.irbDocumentName) {
        try {
          const parentIrbBlob = await DAR.getDARDocumentAsBlob(parentReferenceId, 'irbDocument')
          // Convert blob to File object
          irbDocumentToSubmit = new File([parentIrbBlob], parentDar.irbDocumentName, {
            type: parentIrbBlob.type,
          })
        }
        catch (error) {
          console.warn('Failed to fetch parent IRB document:', error)
          // Continue without IRB document if fetch fails
        }
      }

      const multiPartFormData = createMultiPartFormData(convertFormStateToDAR(formState), irbDocumentToSubmit)
      const submittedPR = await ProgressReport.submitProgressReport(multiPartFormData, parentReferenceId)
      onSuccess(submittedPR)
    }
    catch (error: unknown) {
      handleError('Error: Unable to submit progress report: ', error)
    }
  }

  // compute multipart/form-data object, includes registration information and all files
  const createMultiPartFormData = (progressReport: Partial<CombinedDataAccessRequest>, irbDocument?: File | null) => {
    const multiPartFormData = new FormData()

    multiPartFormData.append('dar', JSON.stringify(progressReport))
    // Endpoint expects files
    // leaving them empty until we provide these fields in the application form
    multiPartFormData.append('collaboratorRequiredFile', '')

    // Use provided IRB document if available, otherwise empty string
    if (irbDocument) {
      multiPartFormData.append('ethicsApprovalRequiredFile', irbDocument)
    }
    else {
      multiPartFormData.append('ethicsApprovalRequiredFile', '')
    }

    return multiPartFormData
  }

  const cancel = async () => {
    try {
      onCancel()
    }
    catch (error: unknown) {
      handleError('Error: Unable to cancel progress report submission: ', error)
    }
  }

  const handleError = (message: string, error: unknown): void => {
    Notifications.showError({ text: message + extractError(error) })
  }
  return (
    <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
      <span>
        {isValid
          ? (
              <AsyncSpinnerButton
                id="btn_submit"
                className="button button-blue"
                style={{ marginRight: '2rem', cursor: 'pointer' }}
                data-cy="pr-submit-button"
                aria-label="Submit progress report"
                onClick={submit}
              >
                Submit
              </AsyncSpinnerButton>
            )
          : (
              <button
                id="btn_validate"
                type="button"
                className="button button-blue"
                style={{ marginRight: '2rem', cursor: 'pointer' }}
                data-cy="pr-validate-button"
                aria-label="Validate form and scroll to first required field"
                onClick={onValidate}
              >
                Validate
              </button>
            )}
      </span>
      <button
        type="button"
        className="button button-white"
        style={{ cursor: 'pointer' }}
        data-cy="pr-cancel-button"
        onClick={cancel}
      >
        Cancel this Update
      </button>
    </div>
  )
}
