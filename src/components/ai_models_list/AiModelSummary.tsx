import React, { useState } from 'react'
import { AiModel, Maintainer } from 'src/types/model'
import { renderColumnContent } from 'src/utils/RenderUtils'
import {
  DeletePresentationOrPublication,
} from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'

interface AiModelSummaryProps {
  readonly aiModel: AiModel
  readonly columnsToShow?: (keyof AiModel)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function AiModelSummary(props: AiModelSummaryProps): React.JSX.Element {
  const { aiModel, columnsToShow, editAction, deleteAction, viewAction, disabled = false } = props

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = {
    cursor: 'not-allowed',
    opacity: 0.5,
  }

  const buttonStyle = disabled ? disabledStyle : {}

  const customRenderers = {
    maintainer: (value: unknown) => {
      const maintainer = value as Maintainer
      if (!maintainer || typeof maintainer !== 'object') return null
      return (
        <span>
          {maintainer.name}
          {maintainer.email ? ` (${maintainer.email})` : ''}
        </span>
      )
    },
    trainedOnDatasets: (value: unknown) => {
      const arr = value as string[]
      return Array.isArray(arr) ? arr.join(', ') : ''
    },
    tags: (value: unknown) => {
      const arr = value as string[]
      return Array.isArray(arr) ? arr.join(', ') : ''
    },
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
  }

  return (
    <div className="collaborator-summary-card">
      {columnsToShow?.map((column, index) => {
        const content = renderColumnContent(column, aiModel[column], customRenderers)
        return content && (
          <div key={'ai_model_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{content}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        {/* view button */}
        <button
          type="button"
          style={{ marginLeft: 10 }}
          onClick={() => viewAction?.()}
          aria-label="View AI model"
        >
          <span
            className="glyphicon glyphicon-eye-open caret-margin collaborator-view-icon"
            aria-hidden="true"
            data-tip="View AI model"
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
          aria-label="Edit AI model"
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit AI model"
            data-for="tip_edit_ai_model"
          />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        {/* delete button */}
        <button
          type="button"
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && setShowDeleteModal(true)}
          disabled={disabled}
          aria-label="Delete AI model"
        >
          <span
            className="glyphicon glyphicon-trash caret-margin collaborator-delete-icon"
            aria-hidden="true"
            data-tip="Delete AI model"
            data-for="tip_delete_ai_model"
          />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
      </div>
      <DeletePresentationOrPublication
        name={aiModel.name}
        objectName="AI model"
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
