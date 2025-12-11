import React from 'react'
import PublicationAddEdit from './PublicationAddEdit'
import PublicationSummary from './PublicationSummary'
import { Publication } from 'src/types/model'

interface PublicationRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  publication: Publication
  readonly publications: Publication[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onPublicationChange: (publications: Publication[]) => void
  readonly disabled: boolean
}

export default function PublicationRow(props: PublicationRowProps): React.JSX.Element {
  const { id, editMode, viewMode, publication, publications, columnsToShow, editAction, deleteAction, closeAction, viewAction, onPublicationChange, disabled } = props

  return (
    <div>
      {(editMode || viewMode) && (
        <PublicationAddEdit
          id={id}
          publication={publication}
          publications={publications}
          closeAction={closeAction}
          onPublicationChange={onPublicationChange}
          readOnly={viewMode}
        />
      )}
      {!editMode && !viewMode && (
        <PublicationSummary
          publication={publication}
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
