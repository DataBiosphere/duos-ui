import React, { useState } from 'react'
import { IntellectualProperty } from 'src/types/model'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface IntellectualPropertySummaryProps {
  readonly intellectualProperty: IntellectualProperty
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export const IntellectualPropertySummary: React.FC<IntellectualPropertySummaryProps> = ({
  intellectualProperty,
  columnsToShow,
  editAction,
  deleteAction,
  viewAction,
  disabled = false,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = {
    cursor: 'not-allowed',
    opacity: 0.5,
  }

  const buttonStyle = disabled ? disabledStyle : {}

  const customRenderers = {
    url: (value: unknown) => {
      if (typeof value === 'string' && value) {
        return (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        )
      }
      return '—'
    },
    tags: (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ')
      }
      return '—'
    },
  }

  return (
    <div className="collaborator-summary-card">
      {columnsToShow.map((column, index) => {
        const rawValue = intellectualProperty[column as keyof IntellectualProperty]
        const columnContent = renderColumnContent(column, rawValue as unknown, customRenderers)
        return columnContent && (
          <div key={'ip_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{columnContent}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        {/* view button */}
        <a
          style={{ marginLeft: 10, marginRight: 10 }}
          onClick={() => viewAction?.()}
        >
          <span
            className="glyphicon glyphicon-eye-open caret-margin collaborator-view-icon"
            aria-hidden="true"
            data-tip="View intellectual property"
            data-for="tip_view"
          />
          <span style={{ marginLeft: '1rem' }} />
        </a>
        {/* edit button */}
        <a
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit dataset"
            data-for="tip_edit"
          />
          <span style={{ marginLeft: '1rem' }} />
        </a>
      </div>
      {/* delete button */}
      <a
        style={{ marginLeft: 10, ...buttonStyle }}
        onClick={() => !disabled && setShowDeleteModal(true)}
      >
        <span
          className="glyphicon glyphicon-trash collaborator-delete-icon"
          aria-hidden="true"
          data-tip="Delete dataset"
          data-for="tip_delete"
        />
        <span style={{ marginLeft: '1rem' }} />
      </a>
      <DeletePresentationOrPublication
        name={intellectualProperty.title || intellectualProperty.type}
        objectName="intellectual property"
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

export default IntellectualPropertySummary
