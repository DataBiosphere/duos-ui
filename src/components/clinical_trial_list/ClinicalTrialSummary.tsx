import React from 'react'
import { ClinicalTrial } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

export default function ClinicalTrialSummary(props: {
  readonly clinicalTrial: ClinicalTrial
  readonly columnsToShow?: (keyof ClinicalTrial | 'dateRange')[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}) {
  const { clinicalTrial, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={clinicalTrial}
      columnsToShow={columnsToShow}
      name={clinicalTrial.title}
      objectName="clinical trial"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
