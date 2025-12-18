import React from 'react'
import { Presentation } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface PresentationSummaryProps {
  readonly presentation: Presentation
  readonly columnsToShow?: (keyof Presentation)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function PresentationSummary(props: PresentationSummaryProps): React.JSX.Element {
  const { presentation, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={presentation}
      columnsToShow={columnsToShow}
      name={presentation.title}
      objectName="presentation"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
