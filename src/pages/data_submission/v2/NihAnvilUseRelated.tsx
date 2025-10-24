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

export const YES_NHGRI_YES_PHS_ID = 'I am NHGRI funded and I have a dbGaP PHS ID already'
export const YES_NHGRI_NO_PHS_ID = 'I am NHGRI funded and I do not have a dbGaP PHS ID'
export const NO_NHGRI_YES_ANVIL = 'I am not NHGRI funded but I am seeking to submit data to AnVIL'
export const NO_NHGRI_NO_ANVIL = 'I am not NHGRI funded and do not plan to store data in AnVIL'

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
        options={[
          { text: YES_NHGRI_YES_PHS_ID, name: YES_NHGRI_YES_PHS_ID },
          { text: YES_NHGRI_NO_PHS_ID, name: YES_NHGRI_NO_PHS_ID },
          { text: NO_NHGRI_YES_ANVIL, name: NO_NHGRI_YES_ANVIL },
          { text: NO_NHGRI_NO_ANVIL, name: NO_NHGRI_NO_ANVIL },
        ]}
        defaultValue={getStudyPropertyByKey(formData, 'nihAnvilUse')}
        validators={[FormValidators.REQUIRED]}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(formData, onChange, input, new NihAnvilUse(input.value as string))
        }}
      />

      {getStudyPropertyByKey(formData, 'nihAnvilUse') === YES_NHGRI_YES_PHS_ID && (
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
