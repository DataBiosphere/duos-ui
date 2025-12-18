import React from 'react'
import { AiModel } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

export default function AiModelSummary(props: {
  readonly aiModel: AiModel
  readonly columnsToShow?: (keyof AiModel)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}) {
  const { aiModel, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={aiModel}
      columnsToShow={columnsToShow}
      name={aiModel.name}
      objectName="AI model"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
