import React from 'react'
import { FundingResource } from 'src/types/model'
import FundingResourceAddEdit from 'src/components/funding_resource_list/FundingResourceAddEdit'
import FundingResourceRow from 'src/components/funding_resource_list/FundingResourceRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

interface FundingResourceListProps {
  readonly fundingResources: FundingResource[]
  readonly columnsToShow?: (keyof FundingResource)[]
  readonly onFundingResourceChange: (items: FundingResource[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function FundingResourceList(props: FundingResourceListProps): React.JSX.Element {
  return (
    <StudyAssetList<
      FundingResource,
      DarErrors,
      React.ComponentProps<typeof FundingResourceAddEdit>,
      React.ComponentProps<typeof FundingResourceRow>
    >
      items={props.fundingResources}
      columnsToShow={props.columnsToShow ?? ['funderName', 'funderProgram', 'grantNumber', 'projectTitle', 'startDate', 'endDate', 'url']}
      onItemsChange={props.onFundingResourceChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={FundingResourceAddEdit}
      RowComponent={FundingResourceRow}
      addButtonId="add-funding-btn"
      addButtonLabel="Add Funding"
      getValidationState={v => v?.fundingResources}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        fundingResources: items,
        closeAction,
        onFundingResourcesChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        fundingResource: baseProps.item,
        fundingResources: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onFundingResourcesChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
      getItemKey={item => item.fundingId}
    />
  )
}
