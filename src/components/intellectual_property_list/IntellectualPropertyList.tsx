import React, { useState } from 'react'
import { IntellectualProperty } from 'src/types/model'
import { IntellectualPropertyAddEdit } from 'src/components/intellectual_property_list/IntellectualPropertyAddEdit'
import IntellectualPropertyRow from 'src/components/intellectual_property_list/IntellectualPropertyRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import StudyAssetAddButton from 'src/pages/data_submission/v2/StudyAssetAddButton'

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

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const handleDeleteIp = (index: number) => {
    const updated = intellectualProperties.filter((_, i) => i !== index)
    onIntellectualPropertyChange(updated)
  }

  const getValidationState = () => validation?.intellectualProperties

  const button = (
    <StudyAssetAddButton
      id="add-ip-btn"
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
          onIpChange={onIntellectualPropertyChange}
        />
      )}
      {intellectualProperties.map((ip: IntellectualProperty, index: number) => (
        <IntellectualPropertyRow
          key={ip.ipId || index}
          id={index}
          editMode={editState[index]}
          ip={ip}
          intellectualProperties={intellectualProperties}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => handleDeleteIp(index)}
          closeAction={() => {
            toggleEditState(index)
            setShowAddEdit(false)
          }}
          onIpChange={onIntellectualPropertyChange}
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
