import React from 'react'
import { FundingResource } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface FundingResourceSummaryProps {
  readonly fundingResource: FundingResource
  readonly columnsToShow?: (keyof FundingResource)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function FundingResourceSummary(props: FundingResourceSummaryProps): React.JSX.Element {
  const { fundingResource, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={fundingResource}
      columnsToShow={columnsToShow}
      name={fundingResource.funderName || fundingResource.projectTitle}
      objectName="funding resource"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
