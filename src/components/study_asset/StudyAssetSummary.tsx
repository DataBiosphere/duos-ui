import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface StudyAssetSummaryProps<T> {
  asset: T
  columnsToShow?: (keyof T | string)[]
  customRenderers: Record<string, (value: unknown) => React.ReactNode>
  name: string
  objectName: string
  editAction: () => void
  deleteAction: () => void
  viewAction?: () => void
  disabled?: boolean
  disableDelete?: boolean
}

export default function StudyAssetSummary<T>({
  asset,
  columnsToShow,
  customRenderers,
  name,
  objectName,
  editAction,
  deleteAction,
  viewAction,
  disabled = false,
  disableDelete = false,
}: StudyAssetSummaryProps<T>) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const disabledStyle = { cursor: 'not-allowed', opacity: 0.5 }
  const editButtonStyle = disabled ? disabledStyle : {}
  const deleteButtonStyle = (disabled || disableDelete) ? disabledStyle : {}

  const cols: (keyof T | string)[]
    = columnsToShow && columnsToShow.length > 0
      ? columnsToShow
      : Object.keys(asset as Record<string, unknown>)

  return (
    <div className="collaborator-summary-card">
      {cols.map((column, index) => {
        const key = String(column)
        const value = (asset as Record<string, unknown>)[key]
        const content = renderColumnContent(key, value, customRenderers)

        const shouldRender = content !== null && content !== undefined

        return shouldRender
          ? (
              <div key={'funding_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
                <span>{content}</span>
              </div>
            )
          : null
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        <button type="button" style={{ marginLeft: 10 }} onClick={() => viewAction?.()} aria-label={`View ${objectName}`}>
          <span className="glyphicon glyphicon-eye-open caret-margin collaborator-view-icon" aria-hidden="true" />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        <button type="button" style={{ marginLeft: 10, ...editButtonStyle }} onClick={() => !disabled && editAction()} disabled={disabled} aria-label={`Edit ${objectName}`}>
          <span className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon" aria-hidden="true" />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        <button type="button" style={{ marginLeft: 10, ...deleteButtonStyle }} onClick={() => !(disabled || disableDelete) && setShowDeleteModal(true)} disabled={disabled || disableDelete} aria-label={`Delete ${objectName}`}>
          <span className="glyphicon glyphicon-trash caret-margin collaborator-delete-icon" aria-hidden="true" />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
      </div>
      <DeletePresentationOrPublication
        name={name}
        objectName={objectName}
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
