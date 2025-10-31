import React from 'react'
import {
  Study,
  NihAnvilUse, DbGaPPhsID,
  DbGaPStudyRegistrationName, EmbargoReleaseDate, SequencingCenter,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  generateFormDateField,
  generateFormTextField,
  getStudyPropertyByKey,
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
        defaultValue={getStudyPropertyByKey(formData, 'nihAnvilUse')}
        validators={[FormValidators.REQUIRED]}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(formData, onChange, input, new NihAnvilUse(input.value as string))
        }}
      />
      {getStudyPropertyByKey(formData, 'nihAnvilUse') === NihAnvilUse.YES_NHGRI_YES_PHS_ID && (
        <>
          {generateFormTextField(formData, onChange, new DbGaPPhsID(), [FormValidators.REQUIRED])}
          {generateFormTextField(formData, onChange, new DbGaPStudyRegistrationName())}
          {generateFormDateField(formData, onChange, new EmbargoReleaseDate(), [FormValidators.DATE])}
          {generateFormTextField(formData, onChange, new SequencingCenter())}
        </>
      )}
    </div>
  )
}
