import React from 'react'
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
  MasterChangeHandler, removeStudyPropertiesByKeys, setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { cloneDeep, unset } from 'lodash'

export interface NihDataManagementProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
  formFiles: unknown
  onFileChange: MasterChangeHandler
}
export const NihDataManagement = (props: NihDataManagementProps) => {
  const { setStudy, onFileChange, study } = props

  const onAlternativeDataSharingPlanReasonsChange = ({ key }: { key: string }) => {
    let setReasons: string[] = getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []
    if (Object.keys(AlternativeDataSharingPlanReasons.VALUES).includes(key)) {
      const target = AlternativeDataSharingPlanReasons.VALUES[key as keyof typeof AlternativeDataSharingPlanReasons.VALUES]
      const index = setReasons.indexOf(target)
      let removed = false
      if (index > -1) {
        setReasons.splice(index, 1)
        removed = true
      }
      else {
        setReasons.push(target)
      }
      if ((target === AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate) && removed) {
        if (setReasons.includes(AlternativeDataSharingPlanReasons.VALUES.legalRestrictions)) {
          setReasons = [AlternativeDataSharingPlanReasons.VALUES.legalRestrictions]
        }
        else {
          setReasons = []
        }
      }
      setStudyPropertyByKey(study, setStudy, { isValid: true }, new AlternativeDataSharingPlanReasons(setReasons))
    }
  }

  return (
    <div className="data-submitter-section">
      {(
        NihAnvilUse.requiresNIHAdministrativeInformation(getStudyPropertyValueByKey(study, NihAnvilUse.key) as string | undefined) && (
          <>
            <h2>NIH Data Management & Sharing Policy Details</h2>
            <FormField
              id={AlternativeDataSharingPlan.key}
              title={AlternativeDataSharingPlan.fieldTitle}
              type={FormFieldTypes.YESNORADIOGROUP}
              defaultValue={getStudyPropertyValueByKey(study, AlternativeDataSharingPlan.key)}
              onChange={({ _key, value }: { _key: string, value: boolean }) => {
                setStudyPropertyByKey(study, setStudy, { isValid: true }, new AlternativeDataSharingPlan(value))
                if (!value) {
                  setStudy((val) => {
                    const newVal = cloneDeep(val)
                    removeStudyPropertiesByKeys(newVal, new Set([AlternativeDataSharingPlanReasons.key,
                      AlternativeDataSharingPlanExplanation.key,
                      AlternativeDataSharingPlanDataSubmitted.key,
                      AlternativeDataSharingPlanDataReleased.key]))
                    unset(study, 'alternativeDataSharingPlanFile')
                    return newVal
                  })
                }
              }}
            />
            {generateStudyPropertyYesNoField(study, setStudy, new AlternativeDataSharingPlan())}

            {(getStudyPropertyValueByKey(study, AlternativeDataSharingPlan.key) === true) && (
              <div>
                <h3>Please mark the reasons for which you are requesting an Alternative Data Sharing plan (check all that apply)*</h3>
                <FormField
                  id="legalRestrictions"
                  defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.legalRestrictions)}
                  type={FormFieldTypes.CHECKBOX}
                  onChange={onAlternativeDataSharingPlanReasonsChange}
                  toggleText="Legal Restrictions"
                />
                <FormField
                  id="isInformedConsentProcessesInadequate"
                  defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate)}
                  type={FormFieldTypes.CHECKBOX}
                  onChange={onAlternativeDataSharingPlanReasonsChange}
                  toggleText="Informed consent processes are inadequate to support data for sharing for the following reasons:"
                />
                {(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.isInformedConsentProcessesInadequate) && (
                  <div style={{ marginLeft: '2rem' }}>
                    <FormField
                      id="consentFormsUnavailable"
                      defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentFormsUnavailable)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent forms are unavailable or non-existant for samples collected after January 25, 2015"
                    />
                    <FormField
                      id="consentProcessDidNotAddressFutureUseOrBroadSharing"
                      defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentProcessDidNotAddressFutureUseOrBroadSharing)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent process did not specifically address future use or broad data sharing for samples collected after January 25, 2015"
                    />
                    <FormField
                      id="consentProcessInadequatelyAddressesRisk"
                      defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentProcessInadequatelyAddressesRisk)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent processes inadequately addresses risks related to future use or broad data sharing for samples collected after January 25, 2015"
                    />
                    <FormField
                      id="consentProcessPrecludesFutureUseOrBroadSharing"
                      defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.consentProcessPrecludesFutureUseOrBroadSharing)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="The consent specifically precludes future use or broad sharing (including a statement that use of data will be limited to the original researchers)"
                    />
                    <FormField
                      id="otherInformedConsentLimitationsOrConcerns"
                      defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.otherInformedConsentLimitationsOrConcerns)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="Other informed consent limitations or concerns"
                    />
                    <FormField
                      id="otherReasonForRequest"
                      defaultValue={(getStudyPropertyValueByKey(study, AlternativeDataSharingPlanReasons.key) as string[] ?? []).includes(AlternativeDataSharingPlanReasons.VALUES.otherReasonForRequest)}
                      type={FormFieldTypes.CHECKBOX}
                      onChange={onAlternativeDataSharingPlanReasonsChange}
                      toggleText="Other"
                    />
                  </div>
                )}
                {generateStudyPropertyFormTextField(study, setStudy, new AlternativeDataSharingPlanExplanation(), [FormValidators.REQUIRED])}
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
                  defaultValue={getStudyPropertyValueByKey(study, AlternativeDataSharingPlanDataSubmitted.key)}
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
                    setStudyPropertyByKey(study, setStudy, input, new AlternativeDataSharingPlanDataSubmitted(input.value as string))
                  }}
                />
                {generateStudyPropertyYesNoField(study, setStudy, new AlternativeDataSharingPlanDataReleased())}
              </div>
            )}
          </>
        ))}
    </div>
  )
}
