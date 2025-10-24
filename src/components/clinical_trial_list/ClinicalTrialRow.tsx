import React from 'react'
import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
import ClinicalTrialSummary from 'src/components/clinical_trial_list/ClinicalTrialSummary'
import { ClinicalTrial } from 'src/types/model'

interface ClinicalTrialRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly clinicalTrial: ClinicalTrial
  readonly clinicalTrials: ClinicalTrial[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly onClinicalTrialChange: (clinicalTrials: ClinicalTrial[]) => void
  readonly disabled: boolean
}

export default function ClinicalTrialRow(props: ClinicalTrialRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    clinicalTrial,
    clinicalTrials,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    onClinicalTrialChange,
    disabled,
  } = props

  return (
    <div>
      {editMode && (
        <ClinicalTrialAddEdit
          id={id}
          clinicalTrial={clinicalTrial}
          clinicalTrials={clinicalTrials}
          closeAction={closeAction}
          onClinicalTrialChange={onClinicalTrialChange}
        />
      )}
      {!editMode && (
        <ClinicalTrialSummary
          clinicalTrial={clinicalTrial}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}
