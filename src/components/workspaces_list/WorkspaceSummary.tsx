import React from 'react'
import { Workspace } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface WorkspaceSummaryProps {
  readonly workspace: Workspace
  readonly columnsToShow?: (keyof Workspace)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function WorkspaceSummary(props: WorkspaceSummaryProps): React.JSX.Element {
  const { workspace, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={workspace}
      columnsToShow={columnsToShow}
      name={workspace.name}
      objectName="workspace"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
