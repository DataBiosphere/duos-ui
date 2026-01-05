import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface IntellectualPropertySummaryProps {
  readonly intellectualProperty: IntellectualProperty
  readonly columnsToShow?: (keyof IntellectualProperty)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function IntellectualPropertySummary(props: IntellectualPropertySummaryProps): React.JSX.Element {
  const { intellectualProperty, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={intellectualProperty}
      columnsToShow={columnsToShow}
      name={intellectualProperty.title || intellectualProperty.type}
      objectName="intellectual property"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
