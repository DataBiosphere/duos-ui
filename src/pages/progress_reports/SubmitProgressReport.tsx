import React from 'react';
import {AxiosError} from 'axios';
import {ProgressReport} from '../../libs/ajax/ProgressReport';
import {Notifications} from '../../libs/utils';
import {ConsentError} from '../../types/responseTypes';
import {ExpectedFormState} from "src/pages/progress_reports/ProgressReportFormState";


interface SubmitProgressReportProps {
  readonly progressReport: ExpectedFormState;
  readonly parentReferenceId: string;
  readonly onSuccess: (result: unknown) => void;
  readonly onCancel: (result: unknown) => void;
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const {progressReport, parentReferenceId, onSuccess, onCancel} = props;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const submittedPR = await ProgressReport.submitProgressReport(createMultiPartFormData(progressReport), parentReferenceId);
      onSuccess(submittedPR);
    } catch (error: unknown) {
      handleError('Error: Unable to submit progress report: ', error);
    }
  }

  // compute multipart/form-data object, includes registration information and all files
  const createMultiPartFormData = (progressReport) => {

    const multiPartFormData = new FormData();

    multiPartFormData.append('dar', JSON.stringify(progressReport));

    // TODO - add files, etc
    // for (const field of Object.keys(formFiles)) {
    //   if (!isNil(formFiles[field])) {
    //     multiPartFormData.append(field, formFiles[field]);
    //   }
    // }

    return multiPartFormData;
  };

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
        <button type={'button'}
                className='button button-blue'
                style={{marginRight: '2rem', cursor: 'pointer'}}
                data-cy='pr-submit-button'
                onClick={submit}>Submit
        </button>
        <button type={'button'}
            className='button button-white'
            style={{cursor: 'pointer'}}
            data-cy='pr-cancel-button'
            onClick={cancel}>Cancel this Update
        </button>
      </div>
  )
}
