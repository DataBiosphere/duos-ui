import React from 'react'
import PublicationAddEdit from './PublicationAddEdit'
import PublicationRow from './PublicationRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { Publication } from 'src/types/model'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

interface PublicationListProps {
  readonly publications: Publication[]
  readonly columnsToShow?: (keyof Publication)[]
  readonly onPublicationChange: (publications: Publication[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function PublicationList(props: PublicationListProps): React.JSX.Element {
  return (
    <StudyAssetList<
      Publication,
      DarErrors,
      React.ComponentProps<typeof PublicationAddEdit>,
      React.ComponentProps<typeof PublicationRow>
    >
      items={props.publications}
      columnsToShow={props.columnsToShow ?? ['title', 'publishedDate', 'journal', 'url', 'doi', 'access']}
      onItemsChange={props.onPublicationChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={PublicationAddEdit}
      RowComponent={PublicationRow}
      addButtonId="add-publication-btn"
      addButtonLabel="Add Publication"
      getValidationState={v => v?.publications}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        publications: items,
        closeAction,
        onPublicationChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        publication: baseProps.item,
        publications: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onPublicationChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
    />
  )
}
