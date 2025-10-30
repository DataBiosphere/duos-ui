import React, { useEffect, useState } from 'react'
import {AlternativeDataSharingPlan, NihAnvilUse, Study} from 'src/pages/data_submission/v2/v2-models'
import {
    generateStudyPropertyYesNoField,
    getStudyPropertyValueByKey,
    MasterChangeHandler
} from 'src/pages/data_submission/v2/v2-common-functions'
import { NO_NHGRI_YES_ANVIL, YES_NHGRI_NO_PHS_ID, YES_NHGRI_YES_PHS_ID } from 'src/pages/data_submission/NihAnvilUse'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'

export interface NihDataManagementProps {
  formData: Study
  onChange: MasterChangeHandler
}
export const NihDataManagement = (props: NihDataManagementProps) => {
  const { onChange, formData } = props
    const [isRequired, setIsRequired] = useState(false)
    const [showAlternativeDataSharingPlan, setShowAlternativeDataSharingPlan] = useState(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlan.key))
    useEffect(() => {
        const nihAnvilUse = getStudyPropertyValueByKey(formData, new NihAnvilUse().key) as string
        setIsRequired(NihAnvilUse.requiresNIHAdministrativeInformation(nihAnvilUse))
    }, [formData])

  return (
    <div className="data-submitter-section">
      {(
        isRequired && (
        <>
          <h2>NIH Data Management & Sharing Policy Details</h2>
            {generateStudyPropertyYesNoField(formData, ({key, value, isValid})=>{
                setShowAlternativeDataSharingPlan(value)
                onChange({key, value, isValid})
            }, new AlternativeDataSharingPlan())}
          {showAlternativeDataSharingPlan && (
            <div>
              <h3>Please mark the reasons for which you are requesting an Alernative Data Sharing plan (check all that apply)*</h3>
              <FormField
                id="legalRestrictions"
                defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.legalRestrictions)}
                type={FormFieldTypes.CHECKBOX}
                onChange={onAlternativeDataSharingPlanReasonsChange}
                toggleText="Legal Restrictions"
              />
              <FormField
                id="isInformedConsentProcessesInadequate"
                defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.isInformedConsentProcessesInadequate)}
                type={FormFieldTypes.CHECKBOX}
                onChange={({ key, value }) => {
                  setShowInadequateConsentProcessesQuestions(value)
                  onAlternativeDataSharingPlanReasonsChange({ key, value })
                }}
                toggleText="Informed consent processes are inadequate to support data for sharing for the following reasons:"
              />
              {showInadequateConsentProcessesQuestions && (
                <div style={{ marginLeft: '2rem' }}>
                  <FormField
                    id="consentFormsUnavailable"
                    defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentFormsUnavailable)}
                    type={FormFieldTypes.CHECKBOX}
                    onChange={onAlternativeDataSharingPlanReasonsChange}
                    toggleText="The consent forms are unavailable or non-existant for samples collected after January 25, 2015"
                  />
                  <FormField
                    id="consentProcessDidNotAddressFutureUseOrBroadSharing"
                    defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessDidNotAddressFutureUseOrBroadSharing)}
                    type={FormFieldTypes.CHECKBOX}
                    onChange={onAlternativeDataSharingPlanReasonsChange}
                    toggleText="The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015"
                  />
                  <FormField
                    id="consentProcessInadequatelyAddressesRisk"
                    defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessInadequatelyAddressesRisk)}
                    type={FormFieldTypes.CHECKBOX}
                    onChange={onAlternativeDataSharingPlanReasonsChange}
                    toggleText="The consent processes inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015"
                  />
                  <FormField
                    id="consentProcessPrecludesFutureUseOrBroadSharing"
                    defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.consentProcessPrecludesFutureUseOrBroadSharing)}
                    type={FormFieldTypes.CHECKBOX}
                    onChange={onAlternativeDataSharingPlanReasonsChange}
                    toggleText="The consent specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)"
                  />
                  <FormField
                    id="otherInformedConsentLimitationsOrConcerns"
                    defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.otherInformedConsentLimitationsOrConcerns)}
                    type={FormFieldTypes.CHECKBOX}
                    onChange={onAlternativeDataSharingPlanReasonsChange}
                    toggleText="Other informed consent limitations or concerns"
                  />
                  <FormField
                    id="otherReasonForRequest"
                    defaultValue={formData?.alternativeDataSharingPlanReasons?.includes(alternativeDataSharingPlanReasonValues.otherReasonForRequest)}
                    type={FormFieldTypes.CHECKBOX}
                    onChange={onAlternativeDataSharingPlanReasonsChange}
                    toggleText="Other"
                  />
                </div>
              )}
              <FormField
                id="alternativeDataSharingPlanExplanation"
                defaultValue={formData?.alternativeDataSharingPlanExplanation}
                onChange={onChange}
                title="Explanation for request"
                validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
                validation={validation.alternativeDataSharingPlanExplanation}
                onValidationChange={onValidationChange}
              />
              <FormField
                type={FormFieldTypes.FILE}
                title="Upload your alternative sharing plan."
                id="alternativeDataSharingPlanFile"
                validators={studyEditMode ? undefined : [FormValidators.REQUIRED]}
                validation={validation.alternativeDataSharingPlanFile}
                onValidationChange={onValidationChange}
                onChange={onFileChange}
              />
              <FormField
                type={FormFieldTypes.RADIOGROUP}
                title="Data will be submitted:"
                id="alternativeDataSharingPlanDataSubmitted"
                defaultValue={formData?.alternativeDataSharingPlanDataSubmitted}
                options={[
                  {
                    text: 'Within 3 months of the last data generated or last clinical visit',
                    name: 'Within 3 months of the last data generated or last clinical visit',
                    id: 'withinThreeMonths',
                  },
                  {
                    text: 'By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
                    name: 'By batches over Study Timeline (e.g. based on clinical trial enrollment benchmarks)',
                    id: 'batches',
                  },
                ]}
                onChange={onChange}
                validation={validation.alternativeDataSharingPlanDataSubmitted}
                onValidationChange={onValidationChange}
              />
              <FormField
                type={FormFieldTypes.YESNORADIOGROUP}
                id="alternativeDataSharingPlanDataReleased"
                defaultValue={formData?.alternativeDataSharingPlanDataReleased}
                title="Data to be released will meet the timeframes specified in the NHGRI Guidance for Data Submission and Data Release"
                onChange={onChange}
                validation={validation.alternativeDataSharingPlanDataReleased}
                onValidationChange={onValidationChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
