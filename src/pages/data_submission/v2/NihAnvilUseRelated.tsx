import React from 'react'
import {
  Study,
  NihAnvilUse, DbGaPPhsID,
  DbGaPStudyRegistrationName, EmbargoReleaseDate, SequencingCenter,
} from 'src/pages/data_submission/v2/v2-models'
import { isNil, toLower } from 'lodash/fp'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { getStudyPropertyByKey, setStudyPropertyByKey } from 'src/pages/data_submission/v2/v2-common-functions'

export const YES_NHGRI_YES_PHS_ID = 'I am NHGRI funded and I have a dbGaP PHS ID already'
export const YES_NHGRI_NO_PHS_ID = 'I am NHGRI funded and I do not have a dbGaP PHS ID'
export const NO_NHGRI_YES_ANVIL = 'I am not NHGRI funded but I am seeking to submit data to AnVIL'
export const NO_NHGRI_NO_ANVIL = 'I am not NHGRI funded and do not plan to store data in AnVIL'

const radioSelectionToLabels = (selection: string) => {
  if (!isNil(selection)) {
    const lowerCaseSelection = toLower(selection)
    switch (lowerCaseSelection) {
      case 'i am nhgri funded and i have a dbgap phs id already':
        return 'yes_nhgri_yes_phs_id'
      case 'i am nhgri funded and i do not have a dbgap phs id already':
        return 'yes_nhgri_no_phs_id'
      case 'i am not nhgri funded but i am seeking to submit data to anvil':
        return 'no_nhgri_yes_anvil'
      case 'i am not nhgri funded and do not plan to store data in anvil':
        return 'no_nhgri_no_anvil'
      default:
        return undefined
    }
  }
}

export interface NihAnvilUseRelatedProps {
  formData: Study
  onChange: ({ key, value, isValid }: { key: string, value: unknown, isValid: boolean }) => void

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
        defaultValue={radioSelectionToLabels(getStudyPropertyByKey(formData, 'nihAnvilUse') as string)}
        validators={[FormValidators.REQUIRED]}
        onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
          setStudyPropertyByKey(formData, onChange, input, new NihAnvilUse(input.value as string))
        }}
      />

      {getStudyPropertyByKey(formData, 'nihAnvilUse') === YES_NHGRI_YES_PHS_ID && (
        <>
          <FormField
            id="dbGaPPhsID"
            title="dbGaP phs ID"
            placeholder="Enter phs ID"
            validators={[FormValidators.REQUIRED]}
            defaultValue={getStudyPropertyByKey(formData, 'dbGaPPhsID')}
            onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new DbGaPPhsID(input.value as string)) }}
          />
          <FormField
            id="dbGaPStudyRegistrationName"
            title="dbGaP Study Registration Name"
            placeholder="Name"
            defaultValue={getStudyPropertyByKey(formData, 'dbGaPStudyRegistrationName')}
            onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new DbGaPStudyRegistrationName(input.value as string)) }}
          />
          <FormField
            id="embargoReleaseDate"
            title="Embargo Release Date"
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            defaultValue={getStudyPropertyByKey(formData, 'embargoReleaseDate')}
            onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new EmbargoReleaseDate(input.value as Date)) }}
          />
          <FormField
            id="sequencingCenter"
            title="Sequencing Center"
            placeholder="Name"
            defaultValue={getStudyPropertyByKey(formData, 'sequencingCenter')}
            onChange={(input: { key: string, value: unknown, isValid: boolean }) => { setStudyPropertyByKey(formData, onChange, input, new SequencingCenter(input.value as string)) }}
          />
        </>
      )}
    </div>
  )
}
