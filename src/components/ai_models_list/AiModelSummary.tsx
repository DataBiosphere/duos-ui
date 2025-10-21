import React from 'react'
import { AiModel, Maintainer } from 'src/types/model'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface AiModelSummaryProps {
  aiModel: AiModel
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly disabled: boolean
}

export default function AiModelSummary(props: AiModelSummaryProps): React.JSX.Element {
  const { aiModel, columnsToShow, editAction, deleteAction, disabled } = props

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
  }

  return (
    <div className="collaborator-summary-card">
      {columnsToShow.map((column, index) => {
        const raw = aiModel[column as keyof AiModel]
        const content = renderColumnContent(column, raw, customRenderers)
        return content && (
          <div key={'ai_model_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{content}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        <a
          style={{ marginLeft: 10, marginRight: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit AI model"
            data-for="tip_edit_ai_model"
          />
          <span style={{ marginLeft: '1rem' }}></span>
        </a>
      </div>
      <a
        style={{ marginLeft: 10, ...buttonStyle }}
        onClick={() => {
          if (disabled) return
          if (window.confirm(`Delete AI model "${aiModel.name}"?`)) {
            deleteAction()
          }
        }}
      >
        <span
          className="glyphicon glyphicon-trash presentation-delete-icon"
          aria-hidden="true"
          data-tip="Delete AI model"
          data-for="tip_delete_ai_model"
        />
        <span style={{ marginLeft: '1rem' }}></span>
      </a>
    </div>
  )
}
