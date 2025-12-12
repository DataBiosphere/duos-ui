import React, { useState } from 'react'
import { Workspace } from 'src/types/model'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface WorkspaceSummaryProps {
  readonly workspace: Workspace
  readonly columnsToShow?: (keyof Workspace)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function WorkspaceSummary(props: WorkspaceSummaryProps): React.JSX.Element {
  const { workspace, columnsToShow, editAction, deleteAction, viewAction, disabled = false } = props

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
    tools: (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ')
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
        const rawValue = workspace[column as keyof Workspace]
        const columnContent = renderColumnContent(column, rawValue as unknown, customRenderers)
        return columnContent && (
          <div key={'workspace_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
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
          aria-label="View workspace"
        >
          <span
            className="glyphicon glyphicon-eye-open caret-margin collaborator-view-icon"
            aria-hidden="true"
            data-tip="View workspace"
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
          aria-label="Edit workspace"
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit workspace"
            data-for="tip_edit_workspace"
          />
          <span style={{ marginLeft: '1rem' }} />
        </button>
        {/* delete button */}
        <button
          type="button"
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && setShowDeleteModal(true)}
          disabled={disabled}
          aria-label="Delete workspace"
        >
          <span
            className="glyphicon glyphicon-trash caret-margin collaborator-delete-icon"
            aria-hidden="true"
            data-tip="Delete workspace"
            data-for="tip_delete_workspace"
          />
          <span style={{ marginLeft: '1rem' }} />
        </button>
      </div>
      <DeletePresentationOrPublication
        name={workspace.name}
        objectName="workspace"
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
