import {div, h, h2, h3} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { nihInstitutions } from './nih_institutions';
import { isEmpty } from 'lodash/fp';
import { useState } from 'react';

export const NIHAdministrativeInformation = (props) => {
  const {
    formData: initialFormData,
    onChange,
    institutions,
  } = props;

  const [showMultiCenterStudy, setShowMultiCenterStudy] = useState(initialFormData?.multiCenterStudy || false);
  const [showGSRNotRequiredExplanation, setShowGSRNotRequiredExplanation] = useState(!initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSR || false);
  const [showAlternativeDataSharingPlan, setShowAlternativeDataSharingPlan] = useState(initialFormData?.alternativeDataSharingPlan || false);

  const [showInadequateConsentProcessesQuestions, setShowInadequateConsentProcessesQuestions] = useState(initialFormData?.isInformedConsentProcessesInadequate || false);

  return div({
    className: 'data-submitter-section',
  }, [
    h2('NIH Administrative Information'),
    h(FormField, {
      id: 'piName',
      title: 'Principal Investigator Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: initialFormData?.piName,
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
      defaultValue: initialFormData?.piInstitution,
    }),
    h(FormField, {
      id: 'nihGrantContractNumber',
      title: 'NIH Grant or Contract Number',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: initialFormData?.nihGrantContractNumber,
    }),
    h(FormField, {
      id: 'nihICsSupportingStudy',
      type: FormFieldTypes.MULTITEXT,
      title: 'NIH ICs Supporting the Study',
      validators: [FormValidators.REQUIRED],
      onChange,
      defaultValue: initialFormData?.nihICsSupportingStudy,
    }),
    h(FormField, {
      id: 'nihProgramOfficerName',
      title: 'NIH Program Officer Name',
      validators: [FormValidators.REQUIRED],
      onChange,
      placeholder: 'Officer Name',
      defaultValue: initialFormData?.nihProgramOfficerName,
    }),
    h(FormField, {
      id: 'nihInstitutionCenterSubmission',
      title: 'NIH Institute/Center for Submission',
      placeholder: 'Institute/Center Name',
      onChange,
      type: FormFieldTypes.SELECT,
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.nihInstitutionCenterSubmission,
      selectOptions: nihInstitutions,
    }),
    h(FormField, {
      id: 'nihGenomicProgramAdministratorName',
      title: 'NIH Genomic Program Administrator Name',
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.nihGenomicProgramAdministratorName,
      onChange,
    }),
    h(FormField, {
      id: 'multiCenterStudy',
      title: 'Is this a multi-center study?',
      type: FormFieldTypes.YESNORADIOGROUP,
      validators: [FormValidators.REQUIRED],
      defaultValue: initialFormData?.multiCenterStudy,
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
      defaultValue: initialFormData?.collaboratingSites,
      validators: [FormValidators.REQUIRED],
      onChange,
    }),
    //NOTE: radio group not equipped to handle yes/no groupings
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
      title: 'Is controlled access required for genomic summary results (GSR)?',
      defaultValue: initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSR,
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
      defaultValue: initialFormData?.controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation,
      validators: [FormValidators.REQUIRED],
      onChange,
    }),

    h(FormField, {
      type: FormFieldTypes.YESNORADIOGROUP,
      id: 'alternativeDataSharingPlan',
      defaultValue: initialFormData?.alternativeDataSharingPlan,
      title: 'Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database?',
      onChange: ({key, value}) => {
        setShowAlternativeDataSharingPlan(value);
        onChange({key, value});
      },
    }),
    div({
      isRendered: showAlternativeDataSharingPlan,
    }, [
      h3(
        'Please mark the reasons for which you are requesting an Alernative Data Sharing plan (check all that apply)'
      ),
      h(FormField, {
        id: 'legalRestrictions',
        defaultValue: initialFormData?.legalRestrictions,
        type: FormFieldTypes.CHECKBOX,
        onChange,
        toggleText: 'Legal Restrictions',
      }),
      h(FormField, {
        id: 'isInformedConsentProcessesInadequate',
        defaultValue: initialFormData?.isInformedConsentProcessesInadequate,
        type: FormFieldTypes.CHECKBOX,
        onChange: ({key, value}) => {
          setShowInadequateConsentProcessesQuestions(value);
          onChange({key, value});
        },
        toggleText:
          'Informed consent processes are inadequate to support data for sharing for the following reasons:',
      }),
      div({
        isRendered: showInadequateConsentProcessesQuestions,
        style: {
          marginLeft: '2rem',
        },
      }, [
        h(FormField, {
          id: 'consentFormsUnavailable',
          defaultValue: initialFormData?.consentFormsUnavailable,
          type: FormFieldTypes.CHECKBOX,
          onChange,
          toggleText:
          'The consent forms are unavailable or non-existant for samples collected after January 25, 2015',
        }),
        h(FormField, {
          id: 'consentProcessDidNotAddressFutureUseOrBroadSharing',
          defaultValue: initialFormData?.consentProcessDidNotAddressFutureUseOrBroadSharing,
          type: FormFieldTypes.CHECKBOX,
          onChange,
          toggleText: 'The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015',
        }),
        h(FormField, {
          id: 'consentProcessInadequatelyAddressesRisk',
          defaultValue: initialFormData?.consentProcessInadequatelyAddressesRisk,
          type: FormFieldTypes.CHECKBOX,
          onChange,
          toggleText: 'The consent processes inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015',
        }),
        h(FormField, {
          id: 'consentProcessPrecludesFutureUseOrBroadSharing',
          defaultValue: initialFormData?.consentProcessPrecludesFutureUseOrBroadSharing,
          type: FormFieldTypes.CHECKBOX,
          onChange,
          toggleText: 'The consent specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)',
        }),
        h(FormField, {
          id: 'otherInformedConsentLimitationsOrConcerns',
          defaultValue: initialFormData?.otherInformedConsentLimitationsOrConcerns,
          type: FormFieldTypes.CHECKBOX,
          onChange,
          toggleText: 'Other informed consent limitations or concerns',
        }),
        h(FormField, {
          id: 'otherReasonForRequest',
          defaultValue: initialFormData?.otherReasonForRequest,
          type: FormFieldTypes.CHECKBOX,
          onChange,
          toggleText: 'Other'
        }),
      ]),
      h(FormField, {
        isRendered: true, // todo: otherReasonForRequest,
        id: 'alternativeDataSharingPlanExplanation',
        defaultValue: initialFormData?.alternativeDataSharingPlanExplanation,
        onChange,
        title: 'Explanation for request',
        validators: [FormValidators.REQUIRED]
      }),
      //Waiting on clarification about file upload buttons vs drag-and-drop/dropzones
      h(FormField, {
        type: FormFieldTypes.FILE,
        title: 'Upload your alternative sharing plan.',
        id: 'alternativeDataSharingPlanFile',
        onChange,
      }),

      h(FormField, {
        type: FormFieldTypes.RADIOGROUP,
        title: 'Data will be submitted:',
        id: 'alternativeDataSharingPlanDataSubmitted',
        defaultValue: initialFormData?.alternativeDataSharingPlanDataSubmitted,
        options: [
          {
            text: 'Within 3 months of the last data generated or last clinical visit',
            name: 'Within 3 months of the last data generated or last clinical visit',
            id: 'withinThreeMonths',
          },
          {
            text: 'By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
            name: 'By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
            id: 'batches',
          }
        ],
        onChange,
      }),
      h(FormField, {
        type: FormFieldTypes.YESNORADIOGROUP,
        id: 'alternativeDataSharingPlanDataReleased',
        defaultValue: initialFormData?.alternativeDataSharingPlanDataReleased,
        title: 'Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release',
        onChange,
      }),

      div({
        style: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
      }, [

        h(FormField, {
          id: 'alternativeDataSharingPlanTargetDeliveryDate',
          style: {
            width: '45%',
          },
          defaultValue: initialFormData?.alternativeDataSharingPlanTargetDeliveryDate,
          title: 'Target Delivery Date',
          placeholder: 'Please enter date (YYYY-MM-DD)',
          validators: [FormValidators.DATE],
          onChange,
        }),
        h(FormField, {
          id: 'alternativeDataSharingPlanTargetPublicReleaseDate',
          style: {
            width: '45%',
          },
          defaultValue: initialFormData?.alternativeDataSharingPlanTargetPublicReleaseDate,
          title: 'Target Public Release Date',
          placeholder: 'Please enter date (YYYY-MM-DD)',
          validators: [FormValidators.DATE],
          onChange,
        }),
      ]),
    ]),

  ]);
};

export default NIHAdministrativeInformation;