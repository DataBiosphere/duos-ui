import React, { useState, useEffect } from 'react'
import CollaboratorForm from './CollaboratorForm'
import CollaboratorRow from 'src/components/collaborator_list/CollaboratorRow'
import './collaborator.css'
import { isNil } from 'src/utils/NodashUtil'
import { Collaborator } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

export interface CollaboratorListProps {
  readonly formFieldChange: (change: { key: string, value: unknown }) => void
  readonly collaboratorLabel: string
  readonly collaboratorKey: string
  readonly countriesOfOperation: string[]
  readonly showApproval: boolean
  readonly setCompleted: (completed: boolean) => void
  // Declared as a flat ValidationError at the ResearcherInfo boundary, but for collaborator
  // lists it's actually populated as a per-index map of per-field errors.
  readonly validation?: ValidationError
  readonly onValidationChange: (change: { key: Array<string | number> | string, validation: ValidationError }) => void
  readonly readOnly?: boolean
  readonly collaborators?: Collaborator[]
  readonly deleteBoolArray?: boolean[]
  readonly disabled?: boolean
}

export default function CollaboratorList(props: Readonly<CollaboratorListProps>) {
  const {
    formFieldChange,
    collaboratorLabel,
    collaboratorKey,
    countriesOfOperation,
    showApproval,
    setCompleted,
    validation,
    onValidationChange,
    readOnly = false,
  } = props

  const collaboratorValidation = validation as unknown as Record<number, Record<string, ValidationError>> | undefined

  const [collaborators, setCollaborators] = useState<Collaborator[]>(props.collaborators || [])
  const [editState, setEditState] = useState<boolean[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [deleteBoolArray, setDeleteBoolArray] = useState<boolean[]>(props.deleteBoolArray || [])

  const onCollaboratorValidationChange = ({ index, key, validation }: {
    index: number
    key?: string
    validation: ValidationError | Record<string, ValidationError>
  }) => {
    // Root-caused in ResearcherInfoProps.formValidationChange: only a flat ValidationError is
    // declared, but the per-collaborator-field bulk-save path genuinely passes an errors map.
    const castValidation = validation as ValidationError
    if (isNil(key)) {
      onValidationChange({ key: [collaboratorKey, index], validation: castValidation })
    }
    else {
      onValidationChange({ key: [collaboratorKey, index, key], validation: castValidation })
    }
  }

  const deleteCollaborator = (index: number) => {
    const deleteCopy = deleteBoolArray.slice()
    const collaboratorCopy = collaborators.slice()
    const editCopy = editState.slice()

    deleteCopy.splice(index, 1)
    collaboratorCopy.splice(index, 1)
    editCopy.splice(index, 1)

    setEditState(editCopy)
    setCollaborators(collaboratorCopy)
    setDeleteBoolArray(deleteCopy)
  }

  useEffect(() => {
    setCompleted(!showNewForm && editState.every(v => !v))
  }, [setCompleted, showNewForm, editState])

  const saveCollaborator = (index: number, newCollaborator: Collaborator) => {
    const newCollaborators = collaborators.slice()
    newCollaborators[index] = newCollaborator
    setCollaborators(newCollaborators)
    const deleteBoolCopy = [...deleteBoolArray, false]
    setDeleteBoolArray(deleteBoolCopy)
  }

  const updateEditState = (index: number, bool: boolean) => {
    const newEditState = [...editState]
    newEditState[index] = bool
    setEditState(newEditState)
  }

  useEffect(() => {
    formFieldChange({ key: collaboratorKey, value: collaborators })
  }, [formFieldChange, collaboratorKey, collaborators])

  const ListItems = (
    <div className="form-group row no-margin">
      {collaborators.map((collaborator, index) => (
        <CollaboratorRow
          key={collaborator.uuid}
          id={index}
          editMode={editState[index]}
          readOnly={readOnly}
          collaborator={collaborator}
          collaboratorText={collaboratorLabel}
          collaborators={collaborators}
          columnsToShow={showApproval ? ['name', 'title', 'eraCommonsId', 'email', 'approval'] : ['name', 'title', 'eraCommonsId', 'email']}
          editAction={() => updateEditState(index, true)}
          deleteAction={() => deleteCollaborator(index)}
          closeAction={() => updateEditState(index, false)}
          onCollaboratorChange={(updatedCollaborators) => {
            // Update the specific collaborator at the index
            const newCollaborator = updatedCollaborators.find(c => c.uuid === collaborator.uuid) || updatedCollaborators[index]
            if (newCollaborator) {
              saveCollaborator(index, newCollaborator)
            }
          }}
          countriesOfOperation={countriesOfOperation}
          showApproverStatus={showApproval}
          // Pass validation-related props for DAR application compatibility
          validation={isNil(collaboratorValidation) ? {} : collaboratorValidation[index] || {}}
          onCollaboratorValidationChange={onCollaboratorValidationChange}
          collaboratorKey={collaboratorKey}
        />
      ))}
    </div>
  )

  return (
    <div className="collaborator-list-component">
      <div className="row no-margin">
        {!showNewForm && (
          <button
            id={`add-${collaboratorKey}-btn`}
            type="button" // default button element type inside a form is "submit".
            className="button button-white"
            style={{
              marginTop: 25,
              marginBottom: 5,
              ...(props.disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}),
            }}
            onClick={() => {
              if (!props.disabled) {
                setShowNewForm(true)
              }
            }}
            disabled={props.disabled}
          >
            Add
            {' '}
            {collaboratorLabel}
          </button>
        )}
        {showNewForm && (
          <CollaboratorForm
            index={collaborators.length}
            collaboratorKey={collaboratorKey}
            saveCollaborator={newCollaborator => saveCollaborator(collaborators.length, newCollaborator)}
            updateEditState={bool => setShowNewForm(bool)}
            collaboratorLabel={collaboratorLabel}
            showApproval={showApproval}
            validation={isNil(collaboratorValidation) ? {} : collaboratorValidation[collaborators.length] || {}}
            onCollaboratorValidationChange={onCollaboratorValidationChange}
            countriesOfOperation={countriesOfOperation}
          />
        )}
      </div>
      {ListItems}
    </div>
  )
}
