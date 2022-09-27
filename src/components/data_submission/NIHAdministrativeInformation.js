import {div, h, h2, h3} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { nihInstitutions } from './nih_institutions';
import { isEmpty } from 'lodash/fp';

export const NIHAdministrativeInformation = (props) => {
  const {
    formData,
    onChange,
    institutions,
  } = props;

  return div({}, [
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
    // //finish up
    // // h(FormField, {
    // //   id: 'multiCenterStudy',
    // //   type: FormFieldTypes.RADIO,
    // //   validators: [FormValidators.REQUIRED],
    // //   defaultValue: multiCenterStudy,
    // //   options: [
    // //     { name: '', displayText: 'Yes' },
    // //     { name: '', displayText: 'No' },
    // //   ],
    // // }),
    h(FormField, {
      id: 'collaboratingSites',
      title: 'What are the collaborating sites?',
      type: FormFieldTypes.MULTITEXT,
      placeholder: 'List site(s) here...',
      defaultValue: formData.collaboratingSites,
      validators: [FormValidators.REQUIRED],
      onChange,
    }),
    // //NOTE: radio group not equipped to handle yes/no groupings
    // // h(FormField, {
    // //   id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
    // //   defaultValue: controlledAccessRequiredForGenomicSummaryResultsGSR,
    // //   type: FormFieldTypes.RADIO,
    // //   validators: [FormFieldTypes.REQUIRED],
    // //   onChange,
    // //   options: [
    // //     {
    // //       id: 'controlledAccessRequiredForGenomicSummaryResultsGSR',
    // //       displayText: 'Yes',
    // //     },
    // //   ],
    // // }),
    h(FormField, {
      id: 'controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation',
      defaultValue: formData.controlledAccessRequiredForGenomicSummaryResultsGSRNotRequiredExplanation,
      validators: [FormFieldTypes.REQUIRED],
      onChange,
      isRendered: true, // todo: controlledAccessRequiredForGenomicSummaryResultsGSR,
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
        onChange,
        toggleText:
          'Informed consent processes are inadequate to support data for sharing for the following reasons:',
      }),
    ]),
    div({ isRendered: true /* todo: isInformedConsentProcessesInadequate */ }, [
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