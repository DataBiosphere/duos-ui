import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { Publication } from 'src/types/model'

interface PublicationSummaryProps {
  publication: Publication
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly disabled: boolean
}

export default function PublicationSummary(props: PublicationSummaryProps): React.JSX.Element {
  const { publication, columnsToShow, editAction, deleteAction, disabled } = props

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = {
    cursor: 'not-allowed',
    opacity: 0.5,
  }

  const buttonStyle = disabled ? disabledStyle : {}

  const renderPublicationColumnContent = (column: string, publication: Publication): React.ReactNode => {
    const value = publication[column as keyof Publication]
    if (column === 'authors') {
      if (Array.isArray(value)) {
        return value.map((author, i) =>
          typeof author === 'object' && author !== null
            ? <span key={author.orcId || i}>{author.name}{i < value.length - 1 ? ', ' : ''}</span>
            : String(author),
        )
      }
      if (value == null) return null
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    if (Array.isArray(value)) return value.join(', ')
    if (value == null) return null
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }

  return (
    <div className="collaborator-summary-card">
      {/* data elements to show in the row summary */}
      {columnsToShow.map((column, index) => {
        const columnContent = renderPublicationColumnContent(column, publication)
        return columnContent && (
          <div key={'publication_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>
              {columnContent}
            </span>
          </div>
        )
      })}
      {/* edit button */}
      <div className="collaborator-summary-edit-delete-buttons">
        <a
          style={{ marginLeft: 10, marginRight: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit dataset"
            data-for="tip_edit"
          >
          </span>
          <span style={{ marginLeft: '1rem' }}></span>
        </a>
      </div>
      {/* delete button */}
      <a
        style={{ marginLeft: 10, ...buttonStyle }}
        onClick={() => !disabled && setShowDeleteModal(true)}
      >
        <span
          className="glyphicon glyphicon-trash publication-delete-icon"
          aria-hidden="true"
          data-tip="Delete dataset"
          data-for="tip_delete"
        >
        </span>
        <span style={{ marginLeft: '1rem' }}></span>
      </a>
      {/* delete modal */}
      <DeletePresentationOrPublication
        name={publication.title}
        objectName="publication"
        showDelete={showDeleteModal}
        confirmAction={() => {
          deleteAction()
          setShowDeleteModal(false)
        }}
        closeAction={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
