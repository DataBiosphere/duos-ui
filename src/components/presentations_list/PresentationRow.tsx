import React from 'react'
import PresentationAddEdit from './PresentationAddEdit'
import PresentationSummary from './PresentationSummary'
import { Presentation } from 'src/types/model'

interface PresentationRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  presentation: Presentation
  readonly presentations: Presentation[]
  readonly columnsToShow?: (keyof Presentation)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onPresentationChange: (presentations: Presentation[]) => void
  readonly disabled: boolean
}

export default function PresentationRow(props: PresentationRowProps): React.JSX.Element {
  const { id, editMode, viewMode, presentation, presentations, columnsToShow, editAction, deleteAction, closeAction, viewAction, onPresentationChange, disabled } = props

  return (
    <div>
      {(editMode || viewMode) && (
        <PresentationAddEdit
          id={id}
          presentation={presentation}
          presentations={presentations}
          closeAction={closeAction}
          onPresentationChange={onPresentationChange}
          readOnly={viewMode}
        />
      )}
      {!editMode && !viewMode && (
        <PresentationSummary
          presentation={presentation}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          viewAction={viewAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}
