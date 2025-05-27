import React from 'react';
import {AxiosError} from 'axios';
import {ProgressReport} from 'src/libs/ajax/ProgressReport';
import {Notifications} from 'src/libs/utils';
import {ConsentError} from 'src/types/responseTypes';
import {Theme} from "src/libs/theme";


interface SubmitProgressReportProps {
  readonly progressReport: object;
  readonly parentReferenceId: string;
  readonly onSuccess: (result: unknown) => void;
  readonly onCancel: (result: unknown) => void;
  readonly disabled?: boolean;
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const {progressReport, parentReferenceId, onSuccess, onCancel, disabled} = props;

  const submit = async () => {
    try {
      const submittedPR = await ProgressReport.submitProgressReport(progressReport, parentReferenceId);
      onSuccess(submittedPR);
    } catch (error: unknown) {
      handleError('Error: Unable to submit progress report: ', error);
    }
  }

  const cancel = async () => {
    try {
      onCancel(progressReport);
    } catch (error: unknown) {
      handleError('Error: Unable to cancel progress report submission: ', error);
    }
  }

  const handleError = (message: string, error: unknown): void => {
    const axiosError = error as AxiosError;
    const consentError = axiosError?.response?.data as ConsentError;
    const serverError = consentError.message ?? 'Unknown error';
    Notifications.showError({text: message + serverError});
  }
  const disabledStyle = {
    backgroundColor: Theme.palette.disabled,
    borderColor: Theme.palette.disabled
  }

  console.log(disabled);
  return (
      <div className='flex flex-row' style={{justifyContent: 'flex-start'}}>
        <span>
            <button type={'button'}
                className='button button-blue'
                style={{marginRight: '2rem', cursor: 'pointer', ...(disabled ? disabledStyle : {})}}
                data-cy='pr-submit-button'
                disabled={disabled}
                title='Complete required form fields to enable submission.'
                onClick={submit}>Submit
            </button>
        </span>
        <button type={'button'}
            className='button button-white'
            style={{cursor: 'pointer'}}
            data-cy='pr-cancel-button'
            onClick={cancel}>Cancel this Update
        </button>
      </div>
  )
}
