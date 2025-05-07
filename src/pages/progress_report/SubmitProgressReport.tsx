import React from 'react';
import {AxiosError} from 'axios';
import {ProgressReport} from '../../libs/ajax/ProgressReport';
import {Notifications} from '../../libs/utils';
import {ConsentError} from '../../types/responseTypes';


interface SubmitProgressReportProps {
  readonly progressReport: object;
  readonly parentReferenceId: string;
  readonly onSuccess: (result: unknown) => void;
  readonly onCancel: (result: unknown) => void;
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const {progressReport, parentReferenceId, onSuccess, onCancel} = props;

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

  return (
      <div className='flex flex-row' style={{justifyContent: 'flex-start'}}>
        <button className='button button-blue'
                style={{marginRight: '2rem'}}
                data-cy='pr-submit-button'
                onClick={submit}>Submit
        </button>
        <button
            className='button button-white'
            data-cy='pr-cancel-button'
            onClick={cancel}>Cancel this update
        </button>
      </div>
  )

}