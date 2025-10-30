import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import { IntellectualPropertySummary } from 'src/components/intellectual_property_list/IntellectualPropertySummary'
import { IntellectualPropertyAddEdit } from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'

interface IntellectualPropertyRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly ip: IntellectualProperty
  readonly intellectualProperties: IntellectualProperty[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly onIpChange: (items: IntellectualProperty[]) => void
  readonly disabled: boolean
}

export const IntellectualPropertyRow: React.FC<IntellectualPropertyRowProps> = ({
  id,
  editMode,
  ip,
  intellectualProperties,
  columnsToShow,
  editAction,
  deleteAction,
  closeAction,
  onIpChange,
  disabled,
}) => {
  return editMode
    ? (
        <IntellectualPropertyAddEdit
          id={id}
          ip={ip}
          intellectualProperties={intellectualProperties}
          closeAction={closeAction}
          onIpChange={onIpChange}
        />
      )
    : (
        <IntellectualPropertySummary
          ip={ip}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          disabled={disabled}
        />
      )
}

export default IntellectualPropertyRow
