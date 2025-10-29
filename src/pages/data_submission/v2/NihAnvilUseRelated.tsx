import React from 'react'
import {
  Study,
  NihAnvilUse, DbGaPPhsID,
  DbGaPStudyRegistrationName, EmbargoReleaseDate, SequencingCenter,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  generateStudyPropertyFormDateField,
  generateStudyPropertyFormTextField,
  getStudyPropertyValueByKey,
  MasterChangeHandler,
  setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'

export interface NihAnvilUseRelatedProps {
  formData: Study
  onChange: MasterChangeHandler
}

export const NihAnvilUseRelated = (props: NihAnvilUseRelatedProps) => {
  const {
    onChange,
    formData,
  } = props

  return (
    <div className="data-submitter-section">
      <h2>NIH and AnVIL use</h2>
      <FormField
        id="nihAnvilUse"
        title="Will you or did you submit data to the NIH?"
        type={FormFieldTypes.RADIOGROUP}
        options={NihAnvilUse.NIH_ANVIL_USE_RADIOGROUP_OPTIONS}
        defaultValue={getStudyPropertyValueByKey(formData, 'nihAnvilUse')}
        validators={[FormValidators.REQUIRED]}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(formData, onChange, input, new NihAnvilUse(input.value as string))
        }}
      />
      {getStudyPropertyValueByKey(formData, 'nihAnvilUse') === NihAnvilUse.YES_NHGRI_YES_PHS_ID && (
        <>
          {generateStudyPropertyFormTextField(formData, onChange, new DbGaPPhsID(), [FormValidators.REQUIRED])}
          {generateStudyPropertyFormTextField(formData, onChange, new DbGaPStudyRegistrationName())}
          {generateStudyPropertyFormDateField(formData, onChange, new EmbargoReleaseDate(), [FormValidators.DATE])}
          {generateStudyPropertyFormTextField(formData, onChange, new SequencingCenter())}
        </>
      )}
    </div>
  )
}
