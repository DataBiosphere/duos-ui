import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import { IntellectualPropertySummary } from 'src/components/intellectual_property_list/IntellectualPropertySummary'
import { IntellectualPropertyAddEdit } from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'

interface IntellectualPropertyRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly intellectualProperty: IntellectualProperty
  readonly intellectualProperties: IntellectualProperty[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onIntellectualPropertyChange: (items: IntellectualProperty[]) => void
  readonly disabled: boolean
}

export const IntellectualPropertyRow: React.FC<IntellectualPropertyRowProps> = ({
  id,
  editMode,
  viewMode,
  intellectualProperty,
  intellectualProperties,
  columnsToShow,
  editAction,
  deleteAction,
  closeAction,
  viewAction,
  onIntellectualPropertyChange,
  disabled,
}) => {
  return (
    <div>
      {(editMode || viewMode) && (
        <IntellectualPropertyAddEdit
          id={id}
          intellectualProperty={intellectualProperty}
          intellectualProperties={intellectualProperties}
          closeAction={closeAction}
          onIntellectualPropertyChange={onIntellectualPropertyChange}
          readOnly={viewMode}
        />
      )}
      {!editMode && !viewMode && (
        <IntellectualPropertySummary
          intellectualProperty={intellectualProperty}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          viewAction={viewAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}

export default IntellectualPropertyRow
