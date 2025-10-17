import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { Presentation, Presenter } from 'src/types/model'
import { renderColumnContent } from 'src/utils/RenderUtils'

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

  const customRenderers = {
    presenter: (value: unknown) => {
      const presenter = value as Presenter
      if (!presenter || typeof presenter !== 'object') return null
      return (
        <span>
          {presenter.name}
          {presenter.email ? ` (${presenter.email})` : ''}
        </span>
      )
    },
  }

  return (
    <div className="collaborator-summary-card">
      {/* data elements to show in the row summary */}
      {columnsToShow.map((column, index) => {
        const columnContent = renderColumnContent(column, presentation[column as keyof Presentation], customRenderers)
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
