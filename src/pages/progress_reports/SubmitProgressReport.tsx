import React from 'react';
import {AxiosError} from 'axios';
import {ProgressReport} from 'src/libs/ajax/ProgressReport';
import {Notifications} from 'src/libs/utils';
import {ConsentError} from 'src/types/responseTypes';
import {
  DMI_INCIDENT_KEYS,
  ExpectedFormState,
  FormState,
  FormStateKey
} from "src/pages/progress_reports/ProgressReportFormState";
import {PublicationOrPresentation} from "src/components/publications_list/PublicationOrPresentation";
import {DataManagementIncident, Presentation, Publication} from "src/types/model";


interface SubmitProgressReportProps {
  readonly formState: FormState;
  readonly parentReferenceId: string;
  readonly onSuccess: (result: unknown) => void;
  readonly onCancel: () => void;
}

export default function SubmitProgressReport(props: SubmitProgressReportProps) {
  const {formState, parentReferenceId, onSuccess, onCancel} = props;

  function getItem<T, K extends keyof T>(obj: {[P in keyof T]?: T[P]}, key: K): T[K] | undefined {
    return obj[key];
  }

  const getPublicationList = (formState: FormState): Publication[] => {
    const publications: PublicationOrPresentation[] = getItem(formState, FormStateKey.PUBLICATIONS) ?? [];
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
    const presentations: PublicationOrPresentation[] = getItem(formState, FormStateKey.PRESENTATIONS) ?? [];
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
      const incident: string = getItem(formState, key) ?? undefined;
      if (incident != undefined) {
        dataManagementIncident.incidents.push(incident);
      }
    });
    dataManagementIncident.description = getItem(formState, FormStateKey.DMI_DESCRIPTION);

    return dataManagementIncident;
  }

  const convertFormStateToExpectedFormState = (formState: FormState): ExpectedFormState => {
    const expectedForm: ExpectedFormState = {} as ExpectedFormState;
    expectedForm.progressReportSummary = getItem(formState, FormStateKey.PROGRESS_REPORT_SUMMARY);
    if (getItem(formState, FormStateKey.INTELLECTUAL_PROPERTY_YES_NO)) {
      expectedForm.intellectualPropertySummary = getItem(formState, FormStateKey.INTELLECTUAL_PROPERTY_SUMMARY);
    }
    expectedForm.datasetIds = getItem(formState, FormStateKey.DATASET_IDS);
    if (getItem(formState, FormStateKey.PUBLICATIONS_YES_NO)) {
      expectedForm.publications = getPublicationList(formState);
    }
    if (getItem(formState, FormStateKey.PRESENTATIONS_YES_NO)) {
      expectedForm.presentations = getPresentationList(formState);
    }
    expectedForm.labCollaborators = getItem(formState, FormStateKey.COLLABORATOR_INTERNAL_LAB_STAFF) ?? [];
    expectedForm.internalCollaborators = getItem(formState, FormStateKey.COLLABORATOR_INTERNAL_COLLABORATORS) ?? [];
    expectedForm.externalCollaborators = getItem(formState, FormStateKey.COLLABORATOR_EXTERNAL_COLLABORATORS) ?? [];
    if (getItem(formState, FormStateKey.DMI_YES_NO)) {
      expectedForm.dataManagementIncident = getDataManagementIncidents(formState);
    }
    if (getItem(formState, FormStateKey.CLOSEOUT_YES_NO)) {
      expectedForm.closeOutSupplement = getItem(formState, FormStateKey.CLOSEOUT_SUPPLEMENT)
    }
    return expectedForm;
  }

  const submit = async () => {
    try {
      const submittedPR = await ProgressReport.submitProgressReport(createMultiPartFormData(convertFormStateToExpectedFormState(formState)), parentReferenceId);
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
