import React from 'react'
import {
  Study,
  NihAnvilUse, DbGaPPhsID,
  DbGaPStudyRegistrationName, EmbargoReleaseDate, SequencingCenter, PiInstitution, NihGrantContractNumber,
  NihICsSupportingStudy, NihProgramOfficerName, NihInstitutionCenterSubmission, NihGenomicProgramAdministratorName,
  MultiCenterStudy, CollaboratingSites, ControlledAccessRequiredForGenomicSummaryResultsGSR,
  ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation, AlternativeDataSharingPlan,
  AlternativeDataSharingPlanReasons, AlternativeDataSharingPlanExplanation, AlternativeDataSharingPlanDataSubmitted,
  AlternativeDataSharingPlanDataReleased,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  generateStudyPropertyFormDateField,
  generateStudyPropertyFormTextField,
  getStudyPropertyValueByKey, removeStudyPropertiesByKeys,
  setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { ALTERNATIVE_DATA_SHARING_PLAN_FILE } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { set, unset } from 'lodash'

export interface NihAnvilUseRelatedProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

export const NihAnvilUseRelated = (props: NihAnvilUseRelatedProps) => {
  const {
    setStudy,
    study,
  } = props

  return (
    <div className="data-submitter-section">
      <h2>NIH and AnVIL use</h2>
      <FormField
        id="nihAnvilUse"
        title="Will you or did you submit data to the NIH?"
        type={FormFieldTypes.RADIOGROUP}
        options={NihAnvilUse.NIH_ANVIL_USE_RADIOGROUP_OPTIONS}
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
      {getStudyPropertyValueByKey(study, 'nihAnvilUse') === NihAnvilUse.YES_NHGRI_YES_PHS_ID && (
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
