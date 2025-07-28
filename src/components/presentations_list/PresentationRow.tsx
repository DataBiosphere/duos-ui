import React from 'react'
import PresentationAddEdit from './PresentationAddEdit'
import PresentationSummary from './PresentationSummary'
import { Presentation } from 'src/types/model'

interface PresentationRowProps {
  readonly id: number
  readonly editMode: boolean
  presentation: Presentation
  readonly presentations: Presentation[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly onPresentationChange: (presentations: Presentation[]) => void
  readonly disabled: boolean
}

export default function PresentationRow(props: PresentationRowProps): React.JSX.Element {
  const { id, editMode, presentation, presentations, columnsToShow, editAction, deleteAction, closeAction, onPresentationChange, disabled } = props

  return (
    <div>
      {editMode && (
        <PresentationAddEdit
          id={id}
          presentation={presentation}
          presentations={presentations}
          closeAction={closeAction}
          onPresentationChange={onPresentationChange}
        />
      )}
      {!editMode && (
        <PresentationSummary
          presentation={presentation}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}
