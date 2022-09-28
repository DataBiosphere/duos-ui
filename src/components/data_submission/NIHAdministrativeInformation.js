import {div, h, h2, h3} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { nihInstitutions } from './nih_institutions';
import { isEmpty } from 'lodash/fp';
import { useState } from 'react';

export const NIHAdministrativeInformation = (props) => {
  const {
    formData,
    onChange,
    institutions,
  } = props;

  const [showMultiCenterStudy, setShowMultiCenterStudy] = useState(formData.multiCenterStudy || false);
  const [showGSRNotRequiredExplanation, setShowGSRNotRequiredExplanation] = useState(!formData.controlledAccessRequiredForGenomicSummaryResultsGSR || false);


  const [showInadequateConsentProcessesQuestions, setShowInadequateConsentProcessesQuestions] = useState(formData.isInformedConsentProcessesInadequate || false);

  return div({
    className: 'data-submitter-section',
  }, [
    h2('NIH Administrative Information'),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: formData.piName,
    }),
    h(FormField, {
      id: 'piInstitution',
      title: 'Principal Investigator Institution',
      isRendered: !isEmpty(institutions),
      validators: [FormValidators.REQUIRED],
      type: FormFieldTypes.SELECT,
      selectOptions: institutions,
      isCreatable: false,
      selectConfig: {},
      onChange,
      defaultValue: formData.piInstitution,
    }),
    h(FormField, {
      id: 'nihGrantContractNumber',
      title: 'NIH Grant or Contract Number',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: formData.nihGrantContractNumber,
    }),
    h(FormField, {
      id: 'nihICsSupportingStudy',
      type: FormFieldTypes.MULTITEXT,
      title: 'NIH ICs Supporting the Study',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: formData.nihICsSupportingStudy,
    }),
    h(FormField, {
      id: 'nihProgramOfficerName',
      title: 'NIH Program Officer Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      placeholder: 'Officer Name',
      defaultValue: formData.nihProgramOfficerName,
    }),
    h(FormField, {
      id: 'nihInstitutionCenterSubmission',
      title: 'NIH Institute/Center for Submission',
      placeholder: 'Institute/Center Name',
      onChange,
      type: FormFieldTypes.SELECT,
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.nihInstitutionCenterSubmission,
      selectOptions: nihInstitutions,
    }),
    h(FormField, {
      id: 'nihGenomicProgramAdministratorName',
      title: 'NIH Genomic Program Administrator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.nihGenomicProgramAdministratorName,
      onChange,
    }),
    h(FormField, {
      id: 'multiCenterStudy',
      title: 'Is this a multi-center study?',
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      defaultValue: formData.multiCenterStudy,
      onChange: ({key, value}) => {
        setShowMultiCenterStudy(value);
        onChange({key, value});
      }
    }),
    h(FormField, {
      id: 'collaboratingSites',
      isRendered: showMultiCenterStudy,
      title: 'What are the collaborating sites?',
      type: FormFieldTypes.MULTITEXT,
      placeholder: 'List site(s) here...',
      defaultValue: formData.collaboratingSites,
      validators: [FormValidators.REQUIRED],
      onChange,
    }),
    //NOTE: radio group not equipped to handle yes/no groupings
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
      title: 'Is controlled access required for genomic summary results (GSR)?',
      defaultValue: formData.controlledAccessRequiredForGenomicSummaryResultsGSR,
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      onChange: ({key, value}) => {
        setShowGSRNotRequiredExplanation(!value);
        onChange({key, value});
      }
    }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation',
      title: 'If no, explain why controlled access is needed for GSR.',
      isRendered: showGSRNotRequiredExplanation,
      defaultValue: formData.controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation,
      validators: [FormValidators.REQUIRED],
      onChange,
    }),
    div({ style: { marginTop: '7%' } }, [
      h3(
        { style: { marginBottom: '3%' } },
        'Please mark the reasons for which you are requesting an Alernative Data Sharing plan (check all that apply)'
      ),
      h(FormField, {
        id: 'legalRestrictions',
        defaultValue: formData.legalRestrictions,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'Legal Restrictions',
      }),
      h(FormField, {
        id: 'isInformedConsentProcessesInadequate',
        defaultValue: formData.isInformedConsentProcessesInadequate,
        type: FormFieldTypes.CHECKBOX,
        onChange: ({key, value}) => {
          setShowInadequateConsentProcessesQuestions(value);
          onChange({key, value});
        },
        toggleText:
          'Informed consent processes are inadequate to support data for sharing for the following reasons:',
      }),
    ]),
    div({
      isRendered: showInadequateConsentProcessesQuestions,
      style: {
        marginLeft: '2rem',
      },
    }, [
      h(FormField, {
        id: 'consentFormsUnavailable',
        defaultValue: formData.consentFormsUnavailable,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText:
          'The consent forms are unavailable or non-existant for samples collected after January 25, 2015',
      }),
      h(FormField, {
        id: 'consentProcessDidNotAddressFutureUseOrBroadSharing',
        defaultValue: formData.consentProcessDidNotAddressFutureUseOrBroadSharing,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015',
      }),
      h(FormField, {
        id: 'consentProcessInadequatelyAddressesRisk',
        defaultValue: formData.consentProcessInadequatelyAddressesRisk,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'The consent processes inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015',
      }),
      h(FormField, {
        id: 'consentProcessPrecludesFutureUseOrBroadSharing',
        defaultValue: formData.consentProcessPrecludesFutureUseOrBroadSharing,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'The consent specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)',
      }),
      h(FormField, {
        id: 'otherInformedConsentLimitationsOrConcerns',
        defaultValue: formData.otherInformedConsentLimitationsOrConcerns,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'Other informed consent limitations or concerns',
      }),
      h(FormField, {
        id: 'otherReasonForRequest',
        defaultValue: formData.otherReasonForRequest,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'Other'
      }),
      h(FormField, {
        isRendered: true, // todo: otherReasonForRequest,
        id: 'alternativeDataSharingPlanExplanation',
        defaultValue: formData.alternativeDataSharingPlanExplanation,
        onChange,
        title: 'Explanation for request',
        validators: [FormValidators.REQUIRED]
      }),
      //Waiting on clarification about file upload buttons vs drag-and-drop/dropzones
    ])
  ]);
};

export default NIHAdministrativeInformation;