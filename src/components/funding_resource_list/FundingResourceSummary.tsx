import React, { useState } from 'react'
import { FundingResource } from 'src/types/model'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface FundingResourceSummaryProps {
  readonly funding: FundingResource
  readonly columnsToShow?: (keyof FundingResource)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function FundingResourceSummary(props: FundingResourceSummaryProps): React.JSX.Element {
  const { funding, columnsToShow, editAction, deleteAction, viewAction, disabled = false } = props

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
      {columnsToShow?.map((column, index) => {
        const rawValue = funding[column as keyof FundingResource]
        const columnContent = renderColumnContent(column, rawValue as unknown, customRenderers)
        return columnContent && (
          <div key={'funding_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{columnContent}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        {/* view button */}
        <button
          type="button"
          style={{ marginLeft: 10 }}
          onClick={() => viewAction?.()}
          aria-label="View funding resource"
        >
          <span
            className="glyphicon glyphicon-eye-open caret-margin collaborator-view-icon"
            aria-hidden="true"
            data-tip="View funding resource"
            data-for="tip_view"
          >
          </span>
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        {/* edit button */}
        <button
          type="button"
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
          disabled={disabled}
          aria-label="Edit funding resource"
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit funding resource"
            data-for="tip_edit_funding"
          />
          <span style={{ marginLeft: '1rem' }} />
        </button>
        {/* delete button */}
        <button
          type="button"
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && setShowDeleteModal(true)}
          disabled={disabled}
          aria-label="Delete funding resource"
        >
          <span
            className="glyphicon glyphicon-trash caret-margin collaborator-delete-icon"
            aria-hidden="true"
            data-tip="Delete funding resource"
            data-for="tip_delete_funding"
          />
          <span style={{ marginLeft: '1rem' }} />
        </button>
      </div>
      <DeletePresentationOrPublication
        name={funding.funderName || funding.projectTitle}
        objectName="funding resource"
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
