import React from 'react'
import { ProgressReport } from 'src/libs/ajax/ProgressReport'
import { Notifications } from 'src/libs/utils'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { CombinedDataAccessRequest } from 'src/types/model'
import { convertFormStateToDAR } from 'src/utils/DarUtils'
import { extractError } from 'src/utils/ErrorUtils'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'

interface SubmitProgressReportProps {
  readonly formState: FormState
  readonly parentReferenceId: string
  readonly onSuccess: (result: unknown) => void
  readonly onCancel: () => void
  readonly isValid?: boolean
  readonly onValidate?: () => void
  readonly uploadedIrbDocument?: File | null
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const { formState, parentReferenceId, onSuccess, onCancel, isValid, onValidate, uploadedIrbDocument } = props

  const submit = async () => {
    try {
      const multiPartFormData = createMultiPartFormData(convertFormStateToDAR(formState), uploadedIrbDocument)
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

    // Only a newly chosen IRB document is sent. Without one, consent gives the report its own copy
    // of the parent's document.
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
