import React from 'react'
import { Workspace } from 'src/types/model'
import WorkspaceAddEdit from 'src/components/workspaces_list/WorkspaceAddEdit'
import WorkspaceSummary from 'src/components/workspaces_list/WorkspaceSummary'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface WorkspaceRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly workspace: Workspace
  readonly workspaces: Workspace[]
  readonly columnsToShow?: (keyof Workspace)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onWorkspaceChange: (items: Workspace[]) => void
  readonly disabled: boolean
}

export default function WorkspaceRow(props: WorkspaceRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    workspace,
    workspaces,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onWorkspaceChange,
    disabled,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={workspace}
      assets={workspaces}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onWorkspaceChange}
      disabled={disabled}
      AddEditComponent={WorkspaceAddEdit}
      SummaryComponent={WorkspaceSummary}
      addEditProps={{
        id,
        workspace,
        workspaces,
        closeAction,
        onWorkspaceChange,
      }}
      summaryProps={{
        workspace,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
