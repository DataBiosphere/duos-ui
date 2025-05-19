import React from 'react';
import {AxiosError} from 'axios';
import {ProgressReport} from '../../libs/ajax/ProgressReport';
import {Notifications} from '../../libs/utils';
import {ConsentError} from '../../types/responseTypes';
import {validationFailed} from "src/utils/darFormUtils";


interface SubmitProgressReportProps {
  readonly progressReport: object;
  readonly parentReferenceId: string;
  readonly onSuccess: (result: unknown) => void;
  readonly onCancel: (result: unknown) => void;
  readonly validateForm: () => any;
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const {progressReport, parentReferenceId, onSuccess, onCancel, validateForm} = props;

  const submit = async (e) => {
    e.preventDefault();
    if (validationFailed(validateForm())) {
      Notifications.showError({text: "Form validation failed. Please check the form for errors."});
    } else {
      try {
        const submittedPR = await ProgressReport.submitProgressReport(progressReport, parentReferenceId);
        onSuccess(submittedPR);
      } catch (error: unknown) {
        handleError('Error: Unable to submit progress report: ', error);
      }
    }
  }

  const cancel = async (e) => {
    e.preventDefault();
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
                style={{marginRight: '2rem', cursor: 'pointer'}}
                data-cy='pr-submit-button'
                onClick={submit}>Submit
        </button>
        <button
            className='button button-white'
            style={{cursor: 'pointer'}}
            data-cy='pr-cancel-button'
            onClick={cancel}>Cancel this Update
        </button>
      </div>
  )
}
