import React from 'react'
import {
  AlternativeDataSharingPlan,
  AlternativeDataSharingPlanDataReleased,
  AlternativeDataSharingPlanDataSubmitted,
  AlternativeDataSharingPlanExplanation,
  AlternativeDataSharingPlanReasons,
  CollaboratingSites,
  ControlledAccessRequiredForGenomicSummaryResultsGSR,
  ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation,
  DbGaPPhsID,
  DbGaPStudyRegistrationName,
  EmbargoReleaseDate,
  MultiCenterStudy,
  NihAnvilUse,
  NihAnvilUsePreSelectOptions,
  NihGenomicProgramAdministratorName,
  NihGrantContractNumber,
  NihICsSupportingStudy,
  NihInstitutionCenterSubmission,
  NihProgramOfficerName,
  PiInstitution,
  SequencingCenter,
  Study,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  generateStudyPropertyFormDateField,
  generateStudyPropertyFormTextField,
  getStudyPropertyValueByKey,
  removeStudyPropertiesByKeys,
  setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { ALTERNATIVE_DATA_SHARING_PLAN_FILE } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { unset } from 'lodash'

export interface NihAnvilUseRelatedProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

export interface NihAnvilUseVisibleOptions {
  text: string
  name: string
}

export const NihAnvilUseRelated = (props: NihAnvilUseRelatedProps) => {
  const [{ setStudy, study }] = [props]
  const [preSelectorValue, setPreSelectorValue] = React.useState<string | undefined>(undefined)

  const handlePreSelectorChange = React.useCallback(
    (input: string) => {
      if (input === NihAnvilUsePreSelectOptions.NO) {
        const translatedNoOption = { key: NihAnvilUse.key, value: NihAnvilUse.NO_NHGRI_NO_ANVIL, isValid: true }
        setStudyPropertyByKey(study, setStudy, translatedNoOption, new NihAnvilUse(translatedNoOption.value))
      }
      else {
        setStudy((val) => {
          const newVal = structuredClone(val)
          removeStudyPropertiesByKeys(newVal, new Set([NihAnvilUse.key]))
          return newVal
        })
      }
      setPreSelectorValue(input)
    },
    [setStudy, study],
  )

  React.useEffect(() => {
    const nihAnvilUseStudyValue = getStudyPropertyValueByKey(study, 'nihAnvilUse') as string | undefined
    if (nihAnvilUseStudyValue) {
      if (nihAnvilUseStudyValue === NihAnvilUse.NO_NHGRI_NO_ANVIL) {
        setPreSelectorValue(NihAnvilUsePreSelectOptions.NO)
      }
      else {
        setPreSelectorValue(NihAnvilUsePreSelectOptions.YES)
      }
    }
  }, [study, setPreSelectorValue])

  return (
    <div className="data-submitter-section">
      <h2>NIH and AnVIL use</h2>
      <FormField
        id="nihAnvilUse_pre_selector"
        title="Input NIH Registration Info?"
        type={FormFieldTypes.RADIOGROUP}
        options={[
          { text: NihAnvilUsePreSelectOptions.YES, name: NihAnvilUsePreSelectOptions.YES },
          { text: NihAnvilUsePreSelectOptions.NO, name: NihAnvilUsePreSelectOptions.NO },
        ]}
        defaultValue={preSelectorValue}
        validators={[FormValidators.REQUIRED]}
        onChange={(input: { key: string, value: string | undefined, isValid: boolean }) => {
          handlePreSelectorChange(input.value as string)
        }}
      />
      {preSelectorValue === NihAnvilUsePreSelectOptions.YES && (
        <FormField
          id="nihAnvilUse"
          title="Will you or did you submit data to the NIH?"
          type={FormFieldTypes.RADIOGROUP}
          options={NihAnvilUse.NIH_ANVIL_USE_RADIOGROUP_YES_OPTIONS}
          defaultValue={getStudyPropertyValueByKey(study, 'nihAnvilUse')}
          validators={[FormValidators.REQUIRED]}
          onChange={(input: { key: string, value: string | undefined, isValid: boolean }) => {
            setStudyPropertyByKey(study, setStudy, input, new NihAnvilUse(input.value as string))
            if (!NihAnvilUse.requiresNIHAdministrativeInformation(input.value)) {
              setStudy((val) => {
                const newVal = structuredClone(val)
                removeStudyPropertiesByKeys(newVal,
                  new Set(
                    [
                      PiInstitution.key,
                      NihGrantContractNumber.key,
                      NihICsSupportingStudy.key,
                      NihProgramOfficerName.key,
                      NihInstitutionCenterSubmission.key,
                      NihGenomicProgramAdministratorName.key,
                      MultiCenterStudy.key,
                      CollaboratingSites.key,
                      ControlledAccessRequiredForGenomicSummaryResultsGSR.key,
                      ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation.key,
                      AlternativeDataSharingPlan.key,
                      AlternativeDataSharingPlanReasons.key,
                      AlternativeDataSharingPlanExplanation.key,
                      AlternativeDataSharingPlanDataSubmitted.key,
                      AlternativeDataSharingPlanDataReleased.key,
                    ]))

                unset(newVal, ALTERNATIVE_DATA_SHARING_PLAN_FILE)
                return newVal
              })
              if (input.value !== NihAnvilUse.YES_NHGRI_YES_PHS_ID) {
                setStudy((val) => {
                  const newVal = structuredClone(val)
                  removeStudyPropertiesByKeys(newVal, new Set([DbGaPPhsID.key,
                    DbGaPStudyRegistrationName.key,
                    EmbargoReleaseDate.key,
                    SequencingCenter.key]))
                  return newVal
                })
              }
            }
          }}
        />
      )}
      {preSelectorValue === NihAnvilUsePreSelectOptions.YES
        && getStudyPropertyValueByKey(study, 'nihAnvilUse') === NihAnvilUse.YES_NHGRI_YES_PHS_ID
        && (
          <>
            {generateStudyPropertyFormTextField(study, setStudy, new DbGaPPhsID(), [FormValidators.REQUIRED])}
            {generateStudyPropertyFormTextField(study, setStudy, new DbGaPStudyRegistrationName())}
            {generateStudyPropertyFormDateField(study, setStudy, new EmbargoReleaseDate(), [FormValidators.DATE])}
            {generateStudyPropertyFormTextField(study, setStudy, new SequencingCenter())}
          </>
        )}
    </div>
  )
}
