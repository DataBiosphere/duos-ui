import React from 'react'
import { Workspace } from 'src/types/model'
import WorkspaceAddEdit from 'src/components/workspaces_list/WorkspaceAddEdit'
import WorkspaceRow from 'src/components/workspaces_list/WorkspaceRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

interface WorkspaceListProps {
  readonly workspaces: Workspace[]
  readonly columnsToShow?: (keyof Workspace)[]
  readonly onWorkspaceChange: (items: Workspace[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function WorkspaceList(props: WorkspaceListProps): React.JSX.Element {
  return (
    <StudyAssetList<
      Workspace,
      DarErrors,
      React.ComponentProps<typeof WorkspaceAddEdit>,
      React.ComponentProps<typeof WorkspaceRow>
    >
      items={props.workspaces}
      columnsToShow={props.columnsToShow ?? ['name', 'platform', 'url', 'description']}
      onItemsChange={props.onWorkspaceChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={WorkspaceAddEdit}
      RowComponent={WorkspaceRow}
      addButtonId="add-workspace-btn"
      addButtonLabel="Add Workspace"
      getValidationState={v => v?.workspaces}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        workspaces: items,
        closeAction,
        onWorkspaceChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        workspace: baseProps.item,
        workspaces: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onWorkspaceChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
      getItemKey={item => item.workspaceId}
    />
  )
}
