import React from 'react'
import { Workspace } from 'src/types/model'
import WorkspaceAddEdit from 'src/components/workspaces_list/WorkspaceAddEdit'
import WorkspaceSummary from 'src/components/workspaces_list/WorkspaceSummary'

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
    <div>
      {(editMode || viewMode) && (
        <WorkspaceAddEdit
          id={id}
          workspace={workspace}
          workspaces={workspaces}
          closeAction={closeAction}
          onWorkspaceChange={onWorkspaceChange}
          readOnly={viewMode}
        />
      )}
      {!editMode && !viewMode && (
        <WorkspaceSummary
          workspace={workspace}
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
