import React from 'react'
import { ClinicalTrial } from 'src/types/model'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'
import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
import ClinicalTrialSummary from 'src/components/clinical_trial_list/ClinicalTrialSummary'

interface ClinicalTrialRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly clinicalTrial: ClinicalTrial
  readonly clinicalTrials: ClinicalTrial[]
  readonly columnsToShow?: (keyof ClinicalTrial)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onClinicalTrialChange: (items: ClinicalTrial[]) => void
  readonly disabled: boolean
}

export default function ClinicalTrialRow(props: ClinicalTrialRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    clinicalTrial,
    clinicalTrials,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onClinicalTrialChange,
    disabled,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={clinicalTrial}
      assets={clinicalTrials}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onClinicalTrialChange}
      disabled={disabled}
      AddEditComponent={ClinicalTrialAddEdit}
      SummaryComponent={ClinicalTrialSummary}
      addEditProps={{
        id,
        clinicalTrial,
        clinicalTrials,
        closeAction,
        onClinicalTrialChange,
      }}
      summaryProps={{
        clinicalTrial,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
