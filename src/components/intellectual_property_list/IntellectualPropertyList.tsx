import React, { useState } from 'react'
import { IntellectualProperty } from 'src/types/model'
import { IntellectualPropertyAddEdit } from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import AddObjectButton from 'src/components/AddObjectButton'

interface IntellectualPropertyListProps {
  readonly intellectualProperties: IntellectualProperty[]
  readonly columnsToShow?: string[]
  readonly onIntellectualPropertyChange: (items: IntellectualProperty[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function IntellectualPropertyList(props: IntellectualPropertyListProps): React.JSX.Element {
  const {
    intellectualProperties,
    columnsToShow = ['title', 'type', 'patentNumber', 'filingDate', 'status', 'url'],
    onIntellectualPropertyChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(intellectualProperties.map(() => false))
  const [viewState, setViewState] = useState(intellectualProperties.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const toggleViewState = (index: number) => {
    const viewStateCopy = [...viewState]
    viewStateCopy[index] = !viewStateCopy[index]
    setViewState(viewStateCopy)
  }

  const handleDeleteIp = (index: number) => {
    const updated = intellectualProperties.filter((_, i) => i !== index)
    onIntellectualPropertyChange(updated)
  }

  const getValidationState = () => validation?.intellectualProperties

  const button = (
    <AddObjectButton
      id="add-intellectual-property-btn"
      label="Add IP"
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState()}
    />
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <IntellectualPropertyAddEdit
          id={-1}
          intellectualProperties={intellectualProperties}
          closeAction={() => setShowAddEdit(false)}
          onIntellectualPropertyChange={onIntellectualPropertyChange}
        />
      )}
      {intellectualProperties.map((intellectualProperty: IntellectualProperty, index: number) => (
        <IntellectualPropertyRow
          key={intellectualProperty.ipId || index}
          id={index}
          editMode={editState[index]}
          viewMode={viewState[index]}
          intellectualProperty={intellectualProperty}
          intellectualProperties={intellectualProperties}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => handleDeleteIp(index)}
          closeAction={() => {
            if (editState[index]) {
              toggleEditState(index)
            }
            else if (viewState[index]) {
              toggleViewState(index)
            }
            setShowAddEdit(false)
          }}
          viewAction={() => toggleViewState(index)}
          onIntellectualPropertyChange={onIntellectualPropertyChange}
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
