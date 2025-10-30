import React, { useState } from 'react'
import { IntellectualProperty } from 'src/types/model'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface IntellectualPropertySummaryProps {
  readonly ip: IntellectualProperty
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly disabled: boolean
}

export const IntellectualPropertySummary: React.FC<IntellectualPropertySummaryProps> = ({
  ip,
  columnsToShow,
  editAction,
  deleteAction,
  disabled,
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
        const rawValue = ip[column as keyof IntellectualProperty]
        const columnContent = renderColumnContent(column, rawValue as unknown, customRenderers)
        return columnContent && (
          <div key={'ip_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{columnContent}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        <button
          type="button"
          style={{ marginLeft: 10, marginRight: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
          disabled={disabled}
          aria-label="Edit intellectual property"
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit intellectual property"
            data-for="tip_edit_ip"
          />
          <span style={{ marginLeft: '1rem' }} />
        </button>
      </div>
      <button
        type="button"
        style={{ marginLeft: 10, ...buttonStyle }}
        onClick={() => !disabled && setShowDeleteModal(true)}
        disabled={disabled}
        aria-label="Delete intellectual property"
      >
        <span
          className="glyphicon glyphicon-trash presentation-delete-icon"
          aria-hidden="true"
          data-tip="Delete intellectual property"
          data-for="tip_delete_ip"
        />
        <span style={{ marginLeft: '1rem' }} />
      </button>
      <DeletePresentationOrPublication
        name={ip.title || ip.type}
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
