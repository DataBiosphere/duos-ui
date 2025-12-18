import React from 'react'
import { IntellectualProperty } from 'src/types/model'
import IntellectualPropertyAddEdit from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

interface IntellectualPropertyListProps {
  readonly intellectualProperties: IntellectualProperty[]
  readonly columnsToShow?: (keyof IntellectualProperty)[]
  readonly onIntellectualPropertyChange: (items: IntellectualProperty[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function IntellectualPropertyList(props: IntellectualPropertyListProps): React.JSX.Element {
  return (
    <StudyAssetList<
      IntellectualProperty,
      DarErrors,
      React.ComponentProps<typeof IntellectualPropertyAddEdit>,
      React.ComponentProps<typeof IntellectualPropertyRow>
    >
      items={props.intellectualProperties}
      columnsToShow={props.columnsToShow ?? ['title', 'type', 'patentNumber', 'filingDate', 'status', 'url', 'contact']}
      onItemsChange={props.onIntellectualPropertyChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={IntellectualPropertyAddEdit}
      RowComponent={IntellectualPropertyRow}
      addButtonId="add-intellectual-property-btn"
      addButtonLabel="Add IP"
      getValidationState={v => v?.intellectualProperties}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        intellectualProperties: items,
        closeAction,
        onIntellectualPropertyChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        intellectualProperty: baseProps.item,
        intellectualProperties: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onIntellectualPropertyChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
    />
  )
}
