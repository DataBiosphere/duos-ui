import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { inlineIconSx } from 'src/libs/inlineIcon'

interface StudyAssetSummaryProps<T> {
  readonly asset: T
  readonly columnsToShow?: (keyof T | string)[]
  readonly name: string
  readonly objectName: string
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
  readonly disableDelete?: boolean
}

export default function StudyAssetSummary<T>({
  asset,
  columnsToShow,
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
        const content = renderColumnContent(key, value, asset)

        const shouldRender = content !== null && content !== undefined

        return shouldRender
          ? (
              <div key={'collaborator-summary-column-' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
                <span>{content}</span>
              </div>
            )
          : null
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        <button type="button" style={{ marginLeft: 10 }} onClick={() => viewAction?.()} aria-label={`View ${objectName}`}>
          <VisibilityOutlinedIcon className="caret-margin collaborator-view-icon" sx={inlineIconSx} />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        <button type="button" style={{ marginLeft: 10, ...editButtonStyle }} onClick={() => !disabled && editAction()} disabled={disabled} aria-label={`Edit ${objectName}`}>
          <EditOutlinedIcon className="caret-margin collaborator-edit-icon" sx={inlineIconSx} />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        <button type="button" style={{ marginLeft: 10, ...deleteButtonStyle }} onClick={() => !(disabled || disableDelete) && setShowDeleteModal(true)} disabled={disabled || disableDelete} aria-label={`Delete ${objectName}`}>
          <DeleteOutlinedIcon className="caret-margin collaborator-delete-icon" sx={inlineIconSx} />
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
