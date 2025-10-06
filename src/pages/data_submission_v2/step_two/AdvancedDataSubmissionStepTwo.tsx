import React from 'react'
import AdvancedFormCommonStudyInformation from './AdvancedFormCommonStudyInformation'
import AdvancedFormDatasetInformation from './AdvancedFormDatasetInformation'

import {
  AdvancedFormState,
} from 'src/pages/data_submission_v2/AdvancedDataSubmissionForm'

export interface StepTwoProps {
  id: string
  formData: AdvancedFormState
  onChange: ({ key, value }: {
    key: string
    value: unknown
  }) => void
}

export const AdvancedDataSubmissionStepTwo = (props: StepTwoProps) => {
  const { id, formData, onChange } = props

  return (
    <div>
      {(formData.step1?.registeringStudyAtBroad === true) && <div>This data will be managed by the Broad DAC</div>}
      {(formData.step1?.registeringStudyAtNIH === true) && <div>This data will be managed by the NHGRI DAC</div>}
      <AdvancedFormCommonStudyInformation step1={formData.step1} step2={formData.step2} onChange={onChange} />
      <AdvancedFormDatasetInformation step2={formData.step2} id={id} onChange={onChange} />
    </div>
  )
}
export default AdvancedDataSubmissionStepTwo
