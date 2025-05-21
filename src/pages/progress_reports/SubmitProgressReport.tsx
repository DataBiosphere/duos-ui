import React from 'react';
import {AxiosError} from 'axios';
import {ProgressReport} from 'src/libs/ajax/ProgressReport';
import {Notifications} from 'src/libs/utils';
import {ConsentError} from 'src/types/responseTypes';
import {validationFailed} from "src/utils/darFormUtils";
import {FormValidationState} from 'src/pages/dar_application/FormValidationState';
import {DMI_INCIDENT_KEYS, FormState} from "src/pages/progress_reports/ProgressReportFormState";
import {PublicationOrPresentation} from "src/components/publications_list/PublicationOrPresentation";
import {
  DataAccessRequest,
  DataManagementIncident,
  Presentation,
  Publication
} from "src/types/model";


interface SubmitProgressReportProps {
  readonly formState: FormState;
  readonly parentReferenceId: string;
  readonly onSuccess: (result: unknown) => void;
  readonly onCancel: () => void;
  readonly validateForm: () => FormValidationState;
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const { formState, parentReferenceId, onSuccess, onCancel, validateForm} = props;

  const getPublicationList = (formState: FormState): Publication[] => {
    const publications: PublicationOrPresentation[] = formState.publications ?? [];
    return publications.map((pub: PublicationOrPresentation) => {
      const expectedPublication: Publication = {} as Publication;
      expectedPublication.title = pub.title;
      expectedPublication.pubmedId = pub.pubmed_id;
      expectedPublication.date = pub.date;
      expectedPublication.authors = pub.authors;
      expectedPublication.bibliographicCitation = pub.bibliographic_citation
      expectedPublication.datasetCitation = pub.dataset_citation;
      expectedPublication.citation = pub.did_cite;
      return expectedPublication;
    });
  };

  const getPresentationList = (formState: FormState): Presentation[] => {
    const presentations: PublicationOrPresentation[] = formState.presentations ?? [];
    return presentations.map((pub: PublicationOrPresentation) => {
      const expectedPresentation: Presentation= {} as Presentation;
      expectedPresentation.title = pub.title;
      expectedPresentation.date = pub.date;
      expectedPresentation.authors = pub.authors;
      expectedPresentation.datasetCitation = pub.dataset_citation;
      expectedPresentation.citation = pub.did_cite;
      expectedPresentation.link = pub.link;
      return expectedPresentation;
    });
  };

  const getDataManagementIncidents = (formState: FormState): DataManagementIncident => {
    const dataManagementIncident: DataManagementIncident = {} as DataManagementIncident;
    dataManagementIncident.incidents = []
    DMI_INCIDENT_KEYS.map((key) => {
      const incident = formState[key] ?? undefined;
      if (incident) {
        dataManagementIncident.incidents.push(key);
      }
    });
    dataManagementIncident.description = formState.dmiDescription ?? '';

    return dataManagementIncident;
  }

  const convertFormStateToDAR = (formState: FormState): Partial<DataAccessRequest> => {
    const expectedForm: Partial<DataAccessRequest> = {} as Partial<DataAccessRequest>;
    expectedForm.progressReportSummary = formState.progressReportSummary;
    if (formState.intellectualPropertyYesNo) {
      expectedForm.intellectualPropertySummary = formState.intellectualPropertySummary;
    }
    expectedForm.datasetIds = formState.datasetIds ?? [];
    if (formState.publicationsYesNo) {
      expectedForm.publications = getPublicationList(formState);
    }
    if (formState.presentationsYesNo) {
      expectedForm.presentations = getPresentationList(formState);
    }
    expectedForm.labCollaborators = formState.labCollaborators ?? [];
    expectedForm.internalCollaborators = formState.internalCollaborators ?? [];
    expectedForm.externalCollaborators = formState.externalCollaborators ?? [];
    if (formState.dmiYesNo) {
      expectedForm.dmi = getDataManagementIncidents(formState);
    }
    if (formState.closeoutYesNo) {
      expectedForm.closeoutSupplement = formState.closeoutSupplement;
    }
    return expectedForm;
  }

  const submit = async () => {
    if (validationFailed(validateForm())) {
      Notifications.showError({text: "Form validation failed. Please check the form for errors."});
    } else {
      try {
        const submittedPR = await ProgressReport.submitProgressReport(createMultiPartFormData(convertFormStateToDAR(formState)), parentReferenceId);
        onSuccess(submittedPR);
      } catch (error: unknown) {
        handleError('Error: Unable to submit progress report: ', error);
      }
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
    multiPartFormData.append('collaboratorRequiredFile', '')
    multiPartFormData.append('ethicsApprovalRequiredFile', '')

    return multiPartFormData;
  };

  const cancel = async () => {
    try {
      onCancel();
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
        <button
            type={'button'}
            className='button button-blue'
            style={{marginRight: '2rem', cursor: 'pointer'}}
            data-cy='pr-submit-button'
            onClick={submit}>Submit
        </button>
        <button
            type={'button'}
            className='button button-white'
            style={{cursor: 'pointer'}}
            data-cy='pr-cancel-button'
            onClick={cancel}>Cancel this Update
        </button>
      </div>
  )
}
