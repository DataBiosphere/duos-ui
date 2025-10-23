import React from 'react'
import { Study, MasterChangeHandler } from 'src/pages/data_submission/v2/v2-models'
import { isNil, toLower } from 'lodash/fp'

export const YES_NHGRI_YES_PHS_ID = 'I am NHGRI funded and I have a dbGaP PHS ID already'
export const YES_NHGRI_NO_PHS_ID = 'I am NHGRI funded and I do not have a dbGaP PHS ID'
export const NO_NHGRI_YES_ANVIL = 'I am not NHGRI funded but I am seeking to submit data to AnVIL'
export const NO_NHGRI_NO_ANVIL = 'I am not NHGRI funded and do not plan to store data in AnVIL'

const nihAnvilUseLabels = {
  yes_nhgri_yes_phs_id: YES_NHGRI_YES_PHS_ID,
  yes_nhgri_no_phs_id: YES_NHGRI_NO_PHS_ID,
  no_nhgri_yes_anvil: NO_NHGRI_YES_ANVIL,
  no_nhgri_no_anvil: NO_NHGRI_NO_ANVIL,
}

const radioSelectionToLabels = (selection) => {
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

export interface NihAnvilUseProps extends MasterChangeHandler {
  formData: Study
}

export const NihAnvilUse = (props: NihAnvilUseProps) => {
  const {
    onChange,
    formData,
  } = props

  return (<></>)
}
