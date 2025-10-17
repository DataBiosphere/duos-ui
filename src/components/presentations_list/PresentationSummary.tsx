import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { Presentation } from 'src/types/model'

interface PresentationSummaryProps {
  presentation: Presentation
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly disabled: boolean
}

export default function PresentationSummary(props: PresentationSummaryProps): React.JSX.Element {
  const { presentation, columnsToShow, editAction, deleteAction, disabled } = props

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = {
    cursor: 'not-allowed',
    opacity: 0.5,
  }

  const buttonStyle = disabled ? disabledStyle : {}

  const renderPresentationColumnContent = (column: string, presentation: Presentation): React.ReactNode => {
    const value = presentation[column as keyof Presentation]
    if (column === 'presenter' && value && typeof value === 'object' && !Array.isArray(value)) {
      return <span>{value.name}{value.email ? ` (${value.email})` : ''}</span>
    }
    if (Array.isArray(value)) return value.join(', ')
    if (value == null) return null
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }

  return (
    <div className="collaborator-summary-card">
      {/* data elements to show in the row summary */}
      {columnsToShow.map((column, index) => {
        const columnContent = renderPresentationColumnContent(column, presentation)
        return columnContent && (
          <div key={'presentation_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
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
          className="glyphicon glyphicon-trash presentation-delete-icon"
          aria-hidden="true"
          data-tip="Delete dataset"
          data-for="tip_delete"
        >
        </span>
        <span style={{ marginLeft: '1rem' }}></span>
      </a>
      {/* delete modal */}
      <DeletePresentationOrPublication
        name={presentation.title}
        objectName="presentation"
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
