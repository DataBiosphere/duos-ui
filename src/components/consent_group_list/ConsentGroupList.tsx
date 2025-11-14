import React, { useState } from 'react'
import { ConsentGroupAddEdit } from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupRow from 'src/components/consent_group_list/ConsentGroupRow'

interface ConsentGroupListProps {
  readonly consentGroups: ConsentGroup2[]
  readonly columnsToShow?: string[]
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
}

export default function ConsentGroupList(props: ConsentGroupListProps): React.JSX.Element {
  const {
    consentGroups,
    columnsToShow = ['name', 'platform', 'url', 'description', 'tools', 'access', 'tags'],
    onConsentGroupChange,
    disabled = false,
    validation,
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

  const getValidationState = () => validation?.workspaces

  return (
    <div className="presentation-list-component">
      <div className="row no-margin">
        <button
          id="add-workspace-btn"
          type="button"
          className="button button-white"
          style={{
            marginTop: 25,
            marginBottom: 5,
            border: getValidationState() ? '1px solid red' : '1px solid #0948B7',
            boxShadow: getValidationState() ? '0 0 5px red' : 'none',
            ...(disabled ? { cursor: 'not-allowed' } : {}),
          }}
          onClick={() => !disabled && setShowAddEdit(true)}
          disabled={disabled}
        >
          Add Workspace
        </button>
        {showAddEdit && (
          <ConsentGroupAddEdit
            id={-1}
            consentGroups={consentGroups}
            closeAction={() => setShowAddEdit(false)}
            onConsentGroupChange={onConsentGroupChange}
          />
        )}
      </div>
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
}
