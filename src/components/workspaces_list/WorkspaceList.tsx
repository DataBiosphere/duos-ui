import React, { useState } from 'react'
import { Workspace } from 'src/types/model'
import { WorkspaceAddEdit } from 'src/components/workspaces_list/WorkspaceAddEdit'
import WorkspaceRow from 'src/components/workspaces_list/WorkspaceRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import AddObjectButton from 'src/components/AddObjectButton'

interface WorkspaceListProps {
  readonly workspaces: Workspace[]
  readonly columnsToShow?: string[]
  readonly onWorkspaceChange: (items: Workspace[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function WorkspaceList(props: WorkspaceListProps): React.JSX.Element {
  const {
    workspaces,
    columnsToShow = ['name', 'platform', 'url', 'description', 'tools', 'access', 'tags'],
    onWorkspaceChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(workspaces.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const handleDeleteWorkspace = (index: number) => {
    const updated = workspaces.filter((_, i) => i !== index)
    onWorkspaceChange(updated)
  }

  const getValidationState = () => validation?.workspaces

  const button = (
    <AddObjectButton
      id="add-workspace-btn"
      label="Add Workspace"
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState()}
    />
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <WorkspaceAddEdit
          id={-1}
          workspaces={workspaces}
          closeAction={() => setShowAddEdit(false)}
          onWorkspaceChange={onWorkspaceChange}
        />
      )}
      {workspaces.map((w: Workspace, index: number) => (
        <WorkspaceRow
          key={w.workspaceId || index}
          id={index}
          editMode={editState[index]}
          workspace={w}
          workspaces={workspaces}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => handleDeleteWorkspace(index)}
          closeAction={() => {
            toggleEditState(index)
            setShowAddEdit(false)
          }}
          onWorkspaceChange={onWorkspaceChange}
          disabled={disabled}
        />
      ))}
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="presentation-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
