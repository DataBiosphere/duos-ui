import React from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { StepOneProps } from '../AdvancedDataSubmissionForm'
import { NHGRIFunding } from 'src/pages/data_submission_v2/step_one/NHGRIFunding'

export const NIHAndAnVILUseMUI = (props: StepOneProps) => {
  const { formData, onChange } = props

  if (!formData?.registeringStudyAtNIH && formData?.NHGRIFunding != undefined) {
    formData.NHGRIFunding = undefined
  }

  return (
    <FormField
      id="NHGRIFunding"
      title="NIH and AnVIL use"
      validators={[FormValidators.REQUIRED]}
      type={FormFieldTypes.RADIOGROUP}
      description="Will you or did you submit data to the NIH?"
      name="step1.NHGRIFunding"
      disabled={!formData?.registeringStudyAtNIH}
      options={[
        { id: NHGRIFunding.NHGRI_WITH_PHS_ID, name: NHGRIFunding.NHGRI_WITH_PHS_ID, text: 'I am NHGRI funded and I have a dbGaP PHS ID already' },
        { id: NHGRIFunding.NHGRI_WITHOUT_PHS_ID, name: NHGRIFunding.NHGRI_WITHOUT_PHS_ID, text: 'I am NHGRI funded and I do not have a dbGaP PHS ID' },
        { id: NHGRIFunding.NO_NHGRI_PUBLISH_TO_ANVIL, name: NHGRIFunding.NO_NHGRI_PUBLISH_TO_ANVIL, text: 'I am not NHGRI funded but I am seeking to submit data to AnVIL' },
        { id: NHGRIFunding.NO_NHGRI_NO_ANVIL, name: NHGRIFunding.NO_NHGRI_NO_ANVIL, text: 'I am not NHGRI funded and do not plan to store data in AnVIL' },
      ]}
      defaultValue={formData?.NHGRIFunding}
      onChange={onChange}
    />
  )
}
