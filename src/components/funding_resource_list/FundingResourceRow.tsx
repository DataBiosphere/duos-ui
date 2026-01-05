import React from 'react'
import FundingResourceAddEdit from 'src/components/funding_resource_list/FundingResourceAddEdit'
import FundingResourceSummary from 'src/components/funding_resource_list/FundingResourceSummary'
import { FundingResource } from 'src/types/model'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface FundingResourceRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly fundingResource: FundingResource
  readonly fundingResources: FundingResource[]
  readonly columnsToShow?: (keyof FundingResource)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onFundingResourcesChange: (resources: FundingResource[]) => void
  readonly disabled: boolean
}

export default function FundingResourceRow(props: FundingResourceRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    fundingResource,
    fundingResources,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onFundingResourcesChange,
    disabled,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={fundingResource}
      assets={fundingResources}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onFundingResourcesChange}
      disabled={disabled}
      AddEditComponent={FundingResourceAddEdit}
      SummaryComponent={FundingResourceSummary}
      addEditProps={{
        id,
        fundingResource,
        fundingResources,
        closeAction,
        onFundingResourcesChange,
      }}
      summaryProps={{
        fundingResource,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
