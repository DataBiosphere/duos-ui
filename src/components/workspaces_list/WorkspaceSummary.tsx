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
  const { workspace } = props

  const customRenderers = {
    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
    tools: (value: unknown) =>
      Array.isArray(value) && value.length > 0 ? (value as string[]).join(', ') : '—',
    tags: (value: unknown) =>
      Array.isArray(value) && value.length > 0 ? (value as string[]).join(', ') : '—',
  }

  return (
    <StudyAssetSummary
      asset={workspace}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={workspace.name}
      objectName="workspace"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
