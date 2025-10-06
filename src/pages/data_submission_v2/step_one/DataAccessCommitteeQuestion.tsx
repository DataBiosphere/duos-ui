import React from 'react'
import { FormGroup } from '@mui/material'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import 'src/components/forms/forms.css'
import { StepOneProps } from 'src/pages/data_submission_v2/AdvancedDataSubmissionForm'

export const DataAccessCommitteeQuestions = (props: StepOneProps) => {
  const { formData, onChange } = props

  const onChangeLocal = ({ key, value }: { key: string, value: unknown }) => {
    if (key === 'step1.registeringStudyAtBroad' && value) {
      if (formData?.registeringStudyAtNIH) {
        formData.registeringStudyAtNIH = false
      }
    }

    if (key === 'step1.registeringStudyAtNIH' && value) {
      if (formData?.registeringStudyAtBroad) {
        formData.registeringStudyAtBroad = false
      }
    }
    onChange({ key: key, value: value })
  }
  return (
    <FormGroup>
      <div className="control-label">Data Access Committee (DAC)</div>
      <div style={{ marginBottom: '15px' }}>Please select the DAC that apply to your study and datasets(s)?</div>
      <FormField
        type={FormFieldTypes.CHECKBOX}
        id="registeringWithBroad"
        name="step1.registeringStudyAtBroad"
        toggleText="I am registering a study at the Broad Institute."
        defaultValue={formData?.registeringStudyAtBroad}
        onChange={onChangeLocal}
      />
      <FormField
        type={FormFieldTypes.CHECKBOX}
        id="registeringWithNIH"
        name="step1.registeringStudyAtNIH"
        toggleText="I am registering datasets with an NIH DAC"
        defaultValue={formData?.registeringStudyAtNIH}
        onChange={onChangeLocal}
      />
    </FormGroup>
  )
}
