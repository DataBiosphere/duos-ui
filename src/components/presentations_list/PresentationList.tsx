import React from 'react'
import PresentationAddEdit from './PresentationAddEdit'
import PresentationRow from './PresentationRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { Presentation } from 'src/types/model'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

interface PresentationListProps {
  readonly presentations: Presentation[]
  readonly columnsToShow?: (keyof Presentation | string)[]
  readonly onPresentationChange: (presentations: Presentation[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function PresentationList(props: PresentationListProps): React.JSX.Element {
  return (
    <StudyAssetList<
      Presentation,
      DarErrors,
      React.ComponentProps<typeof PresentationAddEdit>,
      React.ComponentProps<typeof PresentationRow>
    >
      items={props.presentations}
      columnsToShow={props.columnsToShow ?? ['title', 'date', 'event', 'location', 'url', 'format', 'access']}
      onItemsChange={props.onPresentationChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={PresentationAddEdit}
      RowComponent={PresentationRow}
      addButtonId="add-presentation-btn"
      addButtonLabel="Add Presentation"
      getValidationState={v => v?.presentations}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        presentations: items,
        closeAction,
        onPresentationChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        presentation: baseProps.item,
        presentations: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onPresentationChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
    />
  )
}
