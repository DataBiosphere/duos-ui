import React, { useEffect, useState } from 'react'
import {
  AlternativeDataSharingPlan,
  AlternativeDataSharingPlanDataReleased, AlternativeDataSharingPlanDataSubmitted,
  AlternativeDataSharingPlanExplanation, AlternativeDataSharingPlanReasons,
  NihAnvilUse,
  Study,
} from 'src/pages/data_submission/v2/v2-models'
import {
  generateStudyPropertyFormTextField,
  generateStudyPropertyYesNoField,
  getStudyPropertyValueByKey,
  MasterChangeHandler, setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'

export interface NihDataManagementProps {
  formData: Study
  onChange: MasterChangeHandler
  formFiles: unknown
  onFileChange: MasterChangeHandler
}
export const NihDataManagement = (props: NihDataManagementProps) => {
  const { onChange, onFileChange, formData } = props
  const [isRequired, setIsRequired] = useState(false)
  const [showAlternativeDataSharingPlan, setShowAlternativeDataSharingPlan] = useState(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlan.key))
  useEffect(() => {
    const nihAnvilUse = getStudyPropertyValueByKey(formData, new NihAnvilUse().key) as string
    setIsRequired(NihAnvilUse.requiresNIHAdministrativeInformation(nihAnvilUse))
  }, [formData])

  const onAlternativeDataSharingPlanReasonsChange = ({ key }: { key: string }) => {
    const setReasons: string[] = getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[]
    if (Object.keys(AlternativeDataSharingPlanReasons.VALUES).includes(key)) {
      const target = AlternativeDataSharingPlanReasons.VALUES[key as keyof typeof AlternativeDataSharingPlanReasons.VALUES]
      const index = setReasons.indexOf(target)
      if (index > -1) {
        setReasons.splice(index, 1)
      }
      else {
        setReasons.push(target)
      }
      setStudyPropertyByKey(formData, onChange, { isValid: true }, new AlternativeDataSharingPlanReasons(setReasons))
    }
  }

  return (
    <div className="data-submitter-section">
      {(
        isRequired && (
          <>
            <h2>NIH Data Management & Sharing Policy Details</h2>
            {generateStudyPropertyYesNoField(formData, ({ key, value, isValid }) => {
              setShowAlternativeDataSharingPlan(value)
              onChange({ key, value, isValid })
            }, new AlternativeDataSharingPlan())}
            {showAlternativeDataSharingPlan && (
              <div>
                <h3>Please mark the reasons for which you are requesting an Alternative Data Sharing plan (check all that apply)*</h3>
                <FormField
                  id="legalRestrictions"
                  defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.legalRestrictions)}
                  type={FormFieldTypes.CHECKBOX}
                  onChange={onAlternativeDataSharingPlanReasonsChange}
                  toggleText="Legal Restrictions"
                />
                <FormField
                  id="isInformedConsentProcessesInadequate"
                  defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate)}
                  type={FormFieldTypes.CHECKBOX}
                  onChange={onAlternativeDataSharingPlanReasonsChange}
                  toggleText="Informed consent processes are inadequate to support data for sharing for the following reasons:"
                />
                {(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate) && (
                  <div style={{ marginLeft: '2rem' }}>
                    <FormField
                      id="consentFormsUnavailable"
                      defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentFormsUnavailable)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent forms are unavailable or non-existant for samples collected after January 25, 2015"
                    />
                    <FormField
                      id="consentProcessDidNotAddressFutureUseOrBroadSharing"
                      defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentProcessDidNotAddressFutureUseOrBroadSharing)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015"
                    />
                    <FormField
                      id="consentProcessInadequatelyAddressesRisk"
                      defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentProcessInadequatelyAddressesRisk)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent processes inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015"
                    />
                    <FormField
                      id="consentProcessPrecludesFutureUseOrBroadSharing"
                      defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentProcessPrecludesFutureUseOrBroadSharing)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)"
                    />
                    <FormField
                      id="otherInformedConsentLimitationsOrConcerns"
                      defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.otherInformedConsentLimitationsOrConcerns)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="Other informed consent limitations or concerns"
                    />
                    <FormField
                      id="otherReasonForRequest"
                      defaultValue={(getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.otherReasonForRequest)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="Other"
                    />
                  </div>
                )}
                {generateStudyPropertyFormTextField(formData, onChange, new AlternativeDataSharingPlanExplanation(), [FormValidators.REQUIRED])}
                <FormField
                  type={FormFieldTypes.FILE}
                  title="Upload your alternative sharing plan."
                  id="alternativeDataSharingPlanFile"
                  validators={[FormValidators.REQUIRED]}
                  onChange={onFileChange}
                />
                <FormField
                  type={FormFieldTypes.RADIOGROUP}
                  title={AlternativeDataSharingPlanDataSubmitted.fieldTitle}
                  id={AlternativeDataSharingPlanDataSubmitted.key}
                  defaultValue={getStudyPropertyValueByKey(formData, AlternativeDataSharingPlanDataSubmitted.key)}
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
                  onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
                    setStudyPropertyByKey(formData, onChange, input, new AlternativeDataSharingPlanDataSubmitted(input.value as string))
                  }}
                />
                {generateStudyPropertyYesNoField(formData, onChange, new AlternativeDataSharingPlanDataReleased())}
              </div>
            )}
          </>
        ))}
    </div>
  )
}
