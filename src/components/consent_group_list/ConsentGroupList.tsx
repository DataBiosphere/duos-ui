import React, { useState } from 'react'
import { ConsentGroupAddEdit } from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupRow from 'src/components/consent_group_list/ConsentGroupRow'
import AddObjectButton from 'src/components/AddObjectButton'

interface ConsentGroupListProps {
  readonly consentGroups: ConsentGroup2[]
  readonly columnsToShow?: string[]
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function ConsentGroupList(props: ConsentGroupListProps): React.JSX.Element {
  const {
    consentGroups,
    columnsToShow = ['consentGroupName', 'accessManagement', 'dataLocation', 'numberOfParticipants'],
    onConsentGroupChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(consentGroups.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const handleDeleteConsnetGroup = (index: number) => {
    const updated = consentGroups.filter((_, i) => i !== index)
    onConsentGroupChange(updated)
  }

  const getValidationState = () => validation?.consentGroups

  const button = (
    <AddObjectButton
      id="add-consent-group-btn"
      label="Add Dataset"
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState()}
    />
  )

  const content = (
    <div className="presentation-list-component">
      {showAddEdit && (
        <ConsentGroupAddEdit
          id={-1}
          consentGroups={consentGroups}
          closeAction={() => setShowAddEdit(false)}
          onConsentGroupChange={onConsentGroupChange}
        />
      )}
      <div className="form-group row no-margin">
        {consentGroups.map((cg: ConsentGroup2, index: number) => (
          <ConsentGroupRow
            key={cg.datasetId || index}
            id={index}
            editMode={editState[index]}
            consentGroup={cg}
            consentGroups={consentGroups}
            columnsToShow={columnsToShow}
            editAction={() => toggleEditState(index)}
            deleteAction={() => handleDeleteConsnetGroup(index)}
            closeAction={() => {
              toggleEditState(index)
              setShowAddEdit(false)
            }}
            onConsentGroupChange={onConsentGroupChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="consent-group-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
