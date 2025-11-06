import React, { useState } from 'react'
import { FundingResource } from 'src/types/model'
import { FundingResourceAddEdit } from 'src/components/funding_resource_list/FundingResourceAddEdit'
import FundingResourceRow from 'src/components/funding_resource_list/FundingResourceRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'

interface FundingResourceListProps {
  readonly fundingResources: FundingResource[]
  readonly columnsToShow?: string[]
  readonly onFundingResourceChange: (items: FundingResource[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function FundingResourceList(props: FundingResourceListProps): React.JSX.Element {
  const {
    fundingResources,
    columnsToShow = ['funderName', 'funderProgram', 'grantNumber', 'projectTitle', 'startDate', 'endDate', 'url', 'tags'],
    onFundingResourceChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(fundingResources.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const handleDeleteFunding = (index: number) => {
    const updated = fundingResources.filter((_, i) => i !== index)
    onFundingResourceChange(updated)
  }

  const getValidationState = () => validation?.fundingResources

  const button = (
    <button
      id="add-funding-btn"
      type="button"
      className="button button-white"
      style={{
        marginTop: 0,
        marginBottom: 5,
        border: getValidationState() ? '1px solid red' : '1px solid #0948B7',
        boxShadow: getValidationState() ? '0 0 5px red' : 'none',
        ...(disabled ? { cursor: 'not-allowed' } : {}),
      }}
      onClick={() => !disabled && setShowAddEdit(true)}
      disabled={disabled}
    >
      Add Funding Resource
    </button>
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <FundingResourceAddEdit
          id={-1}
          fundingResources={fundingResources}
          closeAction={() => setShowAddEdit(false)}
          onFundingChange={onFundingResourceChange}
        />
      )}
      {fundingResources.map((f: FundingResource, index: number) => (
        <FundingResourceRow
          key={f.fundingId || index}
          id={index}
          editMode={editState[index]}
          funding={f}
          fundingResources={fundingResources}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => handleDeleteFunding(index)}
          closeAction={() => {
            toggleEditState(index)
            setShowAddEdit(false)
          }}
          onFundingChange={onFundingResourceChange}
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
