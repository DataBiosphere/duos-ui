import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { Author, Publication } from 'src/types/model'
import { renderColumnContent } from 'src/utils/RenderUtils'

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

  const customRenderers = {
    authors: (value: unknown) => {
      if (Array.isArray(value)) {
        return (value as Author[]).map((author, i) => (
          <span key={author.orcId || i}>
            {author.name}{i < (value as Author[]).length - 1 ? ', ' : ''}
          </span>
        ))
      }
      if (typeof value === 'string') return value
      if (value == null) return null
      return JSON.stringify(value)
    },
    url: (value: unknown) => {
      const href = typeof value === 'string' ? value : ''
      if (!href) return null
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {href}
        </a>
      )
    },
  }

  return (
    <div className="collaborator-summary-card">
      {/* data elements to show in the row summary */}
      {columnsToShow.map((column, index) => {
        const columnContent = renderColumnContent(column, publication[column as keyof Publication], customRenderers)
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
