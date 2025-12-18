import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyAddEdit from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertySummary from 'src/components/intellectual_property_list/IntellectualPropertySummary'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface IntellectualPropertyRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly intellectualProperty: IntellectualProperty
  readonly intellectualProperties: IntellectualProperty[]
  readonly columnsToShow?: (keyof IntellectualProperty)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onIntellectualPropertyChange: (items: IntellectualProperty[]) => void
  readonly disabled: boolean
}

export default function IntellectualPropertyRow(props: IntellectualPropertyRowProps): React.JSX.Element {
  const {
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
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={intellectualProperty}
      assets={intellectualProperties}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onIntellectualPropertyChange}
      disabled={disabled}
      AddEditComponent={IntellectualPropertyAddEdit}
      SummaryComponent={IntellectualPropertySummary}
      addEditProps={{
        id,
        intellectualProperty,
        intellectualProperties,
        closeAction,
        onIntellectualPropertyChange,
      }}
      summaryProps={{
        intellectualProperty,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
