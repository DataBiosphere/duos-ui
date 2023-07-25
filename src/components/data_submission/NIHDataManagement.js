import {div, h, h2, h3} from 'react-hyperscript-helpers';
import { FormFieldTypes, FormField, FormValidators } from '../forms/forms';
import { useState } from 'react';
import { YES_NHGRI_YES_PHS_ID, YES_NHGRI_NO_PHS_ID, NO_NHGRI_YES_ANVIL  } from './NihAnvilUse';


const alternativeDataSharingPlanReasonValues = {
  legalRestrictions: 'Legal Restrictions',
  isInformedConsentProcessesInadequate: 'Informed consent processes are inadequate to support data for sharing for the following reasons:',
  consentFormsUnavailable: 'The consent forms are unavailable or non-existent for samples collected after January 25, 2015',
  consentProcessDidNotAddressFutureUseOrBroadSharing: 'The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015',
  consentProcessInadequatelyAddressesRisk: 'The consent process inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015',
  consentProcessPrecludesFutureUseOrBroadSharing: 'The consent process specifically precludes future use or broad data sharing (including a statement that use of data will be limited to the original researchers)',
  otherInformedConsentLimitationsOrConcerns: 'Other informed consent limitations or concerns',
  otherReasonForRequest: 'Other',
};

export const NIHDataManagement = (props) => {
  const {
    formData,
    onChange,
    studyEditMode,
    onFileChange,
    validation,
    onValidationChange,
  } = props;

  const [showAlternativeDataSharingPlan, setShowAlternativeDataSharingPlan] = useState(formData?.alternativeDataSharingPlan === true || false);

  const [showInadequateConsentProcessesQuestions, setShowInadequateConsentProcessesQuestions] =
    useState(
      formData
        ?.alternativeDataSharingPlanReasons
        ?.includes(
          alternativeDataSharingPlanReasonValues
            .isInformedConsentProcessesInadequate)
        || false);

  const [alternativeDataSharingPlanReasons, setAlternativeDataSharingPlanReasons] = useState(formData?.alternativeDataSharingPlanReasons || []);

  const onAlternativeDataSharingPlanReasonsChange = ({key, value}) => {
    const reason = alternativeDataSharingPlanReasonValues[key];
    const shouldBeIncluded = value;

    if (shouldBeIncluded) {
      if (!alternativeDataSharingPlanReasons.includes(reason)) {
        const newDataSharingPlanReasons = alternativeDataSharingPlanReasons.concat(reason);
        setAlternativeDataSharingPlanReasons(newDataSharingPlanReasons);
        onChange({key: 'alternativeDataSharingPlanReasons', value: newDataSharingPlanReasons});
      }
    } else {
      if (alternativeDataSharingPlanReasons.includes(reason)) {
        const newDataSharingPlanReasons = alternativeDataSharingPlanReasons.filter((r) => r !== reason);
        setAlternativeDataSharingPlanReasons(newDataSharingPlanReasons);
        onChange({key: 'alternativeDataSharingPlanReasons', value: newDataSharingPlanReasons});
      }
    }
  };

  return div({
    isRendered:
      (studyEditMode ?
        ['yes_nhgri_yes_phs_id', 'yes_nhgri_no_phs_id', 'no_nhgri_yes_anvil'].includes(formData.properties.nihAnvilUse)
        : [YES_NHGRI_YES_PHS_ID, YES_NHGRI_NO_PHS_ID, NO_NHGRI_YES_ANVIL].includes(formData.nihAnvilUse)),
    className: 'data-submitter-section',
  }, [
    h2('NIH Data Management & Sharing Policy Details'),
    h(FormField, {
      type: FormFieldTypes.YESNORADIOGROUP,
      id: 'alternativeDataSharingPlan',
      defaultValue: studyEditMode ? formData?.properties.alternativeDataSharingPlan : formData?.alternativeDataSharingPlan,
      title: 'Are you requesting an Alternative Data Sharing Plan for samples that cannot be shared through a public repository or database?',
      onChange: ({key, value}) => {
        setShowAlternativeDataSharingPlan(value);
        onChange({key, value});
      },
      validation: validation.alternativeDataSharingPlan,
      onValidationChange,
    }),
    div({
      isRendered: studyEditMode ? formData?.properties.alternativeDataSharingPlan : showAlternativeDataSharingPlan,
    }, [
      h3(
        'Please mark the reasons for which you are requesting an Alernative Data Sharing plan (check all that apply)*',
      ),
      h(FormField, {
        id: 'legalRestrictions',
        defaultValue: studyEditMode ?
          formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.legalRestrictions)
          : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.legalRestrictions),
        type: FormFieldTypes.CHECKBOX,
        onChange: onAlternativeDataSharingPlanReasonsChange,
        toggleText: 'Legal Restrictions',
        validation: validation.alternativeDataSharingPlanReasons,
        onValidationChange: ({validation}) => {
          onValidationChange({key: 'alternativeDataSharingPlanReasons', validation});
        },
      }),
      h(FormField, {
        id: 'isInformedConsentProcessesInadequate',
        defaultValue: studyEditMode ?
          formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.isInformedConsentProcessesInadequate)
          : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.isInformedConsentProcessesInadequate),
        type: FormFieldTypes.CHECKBOX,
        onChange: ({key, value}) => {
          setShowInadequateConsentProcessesQuestions(value);
          onAlternativeDataSharingPlanReasonsChange({key, value});
        },
        toggleText:
          'Informed consent processes are inadequate to support data for sharing for the following reasons:',
        validation: validation.alternativeDataSharingPlanReasons,
        onValidationChange: ({validation}) => {
          onValidationChange({key: 'alternativeDataSharingPlanReasons', validation});
        },
      }),
      div({
        isRendered: studyEditMode ?
          formData
            ?.properties.alternativeDataSharingPlanReasons
            ?.includes(
              alternativeDataSharingPlanReasonValues
                .isInformedConsentProcessesInadequate)
          : showInadequateConsentProcessesQuestions,
        style: {
          marginLeft: '2rem',
        },
      }, [
        h(FormField, {
          id: 'consentFormsUnavailable',
          defaultValue: studyEditMode ?
            formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentFormsUnavailable)
            : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentFormsUnavailable),
          type: FormFieldTypes.CHECKBOX,
          onChange: onAlternativeDataSharingPlanReasonsChange,
          toggleText:
          'The consent forms are unavailable or non-existant for samples collected after January 25, 2015',
        }),
        h(FormField, {
          id: 'consentProcessDidNotAddressFutureUseOrBroadSharing',
          defaultValue: studyEditMode ?
            formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessDidNotAddressFutureUseOrBroadSharing)
            : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessDidNotAddressFutureUseOrBroadSharing),
          type: FormFieldTypes.CHECKBOX,
          onChange: onAlternativeDataSharingPlanReasonsChange,
          toggleText: 'The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015',
        }),
        h(FormField, {
          id: 'consentProcessInadequatelyAddressesRisk',
          defaultValue: studyEditMode ?
            formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessInadequatelyAddressesRisk)
            : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessInadequatelyAddressesRisk),
          type: FormFieldTypes.CHECKBOX,
          onChange: onAlternativeDataSharingPlanReasonsChange,
          toggleText: 'The consent processes inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015',
        }),
        h(FormField, {
          id: 'consentProcessPrecludesFutureUseOrBroadSharing',
          defaultValue: studyEditMode ?
            formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessPrecludesFutureUseOrBroadSharing)
            : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessPrecludesFutureUseOrBroadSharing),
          type: FormFieldTypes.CHECKBOX,
          onChange: onAlternativeDataSharingPlanReasonsChange,
          toggleText: 'The consent specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)',
        }),
        h(FormField, {
          id: 'otherInformedConsentLimitationsOrConcerns',
          defaultValue: studyEditMode ?
            formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.otherInformedConsentLimitationsOrConcerns)
            : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.otherInformedConsentLimitationsOrConcerns),
          type: FormFieldTypes.CHECKBOX,
          onChange: onAlternativeDataSharingPlanReasonsChange,
          toggleText: 'Other informed consent limitations or concerns',
        }),
        h(FormField, {
          id: 'otherReasonForRequest',
          defaultValue: studyEditMode ?
            formData?.properties.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.otherReasonForRequest)
            : formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.otherReasonForRequest),
          type: FormFieldTypes.CHECKBOX,
          onChange: onAlternativeDataSharingPlanReasonsChange,
          toggleText: 'Other'
        }),
      ]),
      h(FormField, {
        isRendered: true, // todo: otherReasonForRequest,
        id: 'alternativeDataSharingPlanExplanation',
        defaultValue: studyEditMode ? formData?.properties.alternativeDataSharingPlanExplanation : formData?.alternativeDataSharingPlanExplanation,
        onChange,
        title: 'Explanation for request',
        validators: [FormValidators.REQUIRED],
        validation: validation.alternativeDataSharingPlanExplanation,
        onValidationChange,
      }),
      h(FormField, {
        type: FormFieldTypes.FILE,
        title: 'Upload your alternative sharing plan.',
        id: 'alternativeDataSharingPlanFile',
        validators: [FormValidators.REQUIRED],
        validation: validation.alternativeDataSharingPlanFile,
        onValidationChange,
        onChange: onFileChange,
      }),

      h(FormField, {
        type: FormFieldTypes.RADIOGROUP,
        title: 'Data will be submitted:',
        id: 'alternativeDataSharingPlanDataSubmitted',
        defaultValue: studyEditMode ? formData?.properties.alternativeDataSharingPlanDataSubmitted : formData?.alternativeDataSharingPlanDataSubmitted,
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
        validation: validation.alternativeDataSharingPlanDataSubmitted,
        onValidationChange,
      }),
      h(FormField, {
        type: FormFieldTypes.YESNORADIOGROUP,
        id: 'alternativeDataSharingPlanDataReleased',
        defaultValue: studyEditMode ? formData?.properties.alternativeDataSharingPlanDataReleased : formData?.alternativeDataSharingPlanDataReleased,
        title: 'Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release',
        onChange,
        validation: validation.alternativeDataSharingPlanDataReleased,
        onValidationChange,
      }),
    ]),
  ]);
};

export default NIHDataManagement;