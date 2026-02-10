import React from 'react'
import { Biospecimen } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

export default function BiospecimenSummary(props: {
  readonly biospecimen: Biospecimen
  readonly columnsToShow?: (keyof Biospecimen)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}) {
  const { biospecimen, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={biospecimen}
      columnsToShow={columnsToShow}
      name={biospecimen.specimenType}
      objectName="Biospecimen"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
