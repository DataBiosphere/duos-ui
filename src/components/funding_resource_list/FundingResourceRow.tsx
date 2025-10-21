import React from 'react'
import { FundingResource } from 'src/types/model'
import { FundingResourceAddEdit } from 'src/components/funding_resource_list/FundingResourceAddEdit'
import { FundingResourceSummary } from 'src/components/funding_resource_list/FundingResourceSummary'

interface fundingResourceRowProps {
  readonly id: number
  readonly editMode: boolean
  funding: FundingResource
  readonly fundingResources: FundingResource[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly onFundingChange: (items: FundingResource[]) => void
  readonly disabled: boolean
}

export default function FundingResourceRow(props: fundingResourceRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    funding,
    fundingResources,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    onFundingChange,
    disabled,
  } = props

  return (
    <div>
      {editMode && (
        <FundingResourceAddEdit
          id={id}
          funding={funding}
          fundingResources={fundingResources}
          closeAction={closeAction}
          onFundingChange={onFundingChange}
        />
      )}
      {!editMode && (
        <FundingResourceSummary
          funding={funding}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}
