import React from 'react'
import FundingResourceAddEdit from 'src/components/funding_resource_list/FundingResourceAddEdit'
import FundingResourceSummary from 'src/components/funding_resource_list/FundingResourceSummary'
import { FundingResource } from 'src/types/model'

interface FundingResourceRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly funding: FundingResource
  readonly fundingResources: FundingResource[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onFundingChange: (items: FundingResource[]) => void
  readonly disabled: boolean
}

export default function FundingResourceRow(props: FundingResourceRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    funding,
    fundingResources,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onFundingChange,
    disabled,
  } = props

  return (
    <div>
      {(editMode || viewMode) && (
        <FundingResourceAddEdit
          id={id}
          funding={funding}
          fundingResources={fundingResources}
          closeAction={closeAction}
          onFundingChange={onFundingChange}
          readOnly={viewMode}
        />
      )}
      {!editMode && !viewMode && (
        <FundingResourceSummary
          funding={funding}
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
