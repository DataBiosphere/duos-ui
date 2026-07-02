import {
  FormField,
  FormFieldTypes,
  FormValidators,
} from 'src/components/forms/forms'
import React, { useEffect, useState } from 'react'
import { isNil } from 'src/utils/NodashUtil'
import { v4 as uuidV4 } from 'uuid'
import { computeCollaboratorErrors } from 'src/utils/darFormUtils'
import DeleteCollaboratorModal from './DeleteCollaboratorModal'
import { nihAccountLabel } from 'src/components/era_commons/ERACommonsUtils'
import ApproverStatus, { ApproverStatusType } from 'src/pages/dar_application/collaborator/ApproverStatus'
import { Countries } from 'src/libs/ajax/Countries'
import { Collaborator } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

export interface CollaboratorFormProps {
  readonly index: number
  collaborator?: Collaborator
  readonly collaboratorKey: string
  readonly collaboratorLabel: string
  readonly countriesOfOperation: string[]
  validation: Record<string, ValidationError>
  readonly onCollaboratorValidationChange: (params: {
    index: number
    key?: string
    validation: ValidationError | Record<string, ValidationError>
  }) => void
  readonly readOnly?: boolean
  readonly showApproval?: boolean
  readonly saveCollaborator: (collaborator: Collaborator) => void
  readonly updateEditState: (editing: boolean) => void
  readonly deleteCollaborator?: () => void
  readonly toggleDeleteBool?: (value: boolean) => void
  readonly deleteMode?: boolean
}

export default function CollaboratorForm(props: Readonly<CollaboratorFormProps>) {
  const {
    index,
    collaborator,
    collaboratorKey,
    collaboratorLabel,
    countriesOfOperation,
    validation,
    onCollaboratorValidationChange,
    readOnly = false,
    showApproval,
    saveCollaborator: saveCollaboratorProp,
    updateEditState,
    deleteCollaborator,
    toggleDeleteBool,
    deleteMode,
  } = props

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eraCommonsId, setEraCommonsId] = useState('')
  const [title, setTitle] = useState('')
  const [approverStatus, setApproverStatus] = useState<ApproverStatusType>(undefined)
  const [uuid, setUuid] = useState('')
  const [showDeleteCollaboratorModal, setShowDeleteCollaboratorModal] = useState(false)
  const accountLabel = nihAccountLabel()
  const [countryOfOperation, setCountryOfOperation] = useState('')

  const onValidationChange = ({ key, validation }: { key: string, validation: ValidationError }) => {
    onCollaboratorValidationChange({ index, key, validation })
  }

  useEffect(() => {
    const init = () => {
      if (isNil(collaborator)) {
        setUuid(uuidV4())
        setCountryOfOperation(Countries.DEFAULT_COUNTRY)
        return
      }
      setName(collaborator.name)
      setEmail(collaborator.email)
      setEraCommonsId(collaborator.eraCommonsId)
      setTitle(collaborator.title)
      setApproverStatus(collaborator.approverStatus)
      setUuid(collaborator.uuid)
      setCountryOfOperation(collaborator.countryOfOperation)
    }
    init()
  }, [collaborator])

  const saveUpdate = () => {
    saveCollaboratorProp({ name, eraCommonsId, title, email, approverStatus, uuid, countryOfOperation } as Collaborator)
    updateEditState(false)
  }

  const closeDelete = () => {
    setShowDeleteCollaboratorModal(false)
  }

  // Collapses the "!readOnly ? validation.field : {}" ternary repeated per field into a single
  // computation, since Sonar flags each repeated negated ternary as its own complexity/readability hit.
  const displayValidation: Record<string, ValidationError> = readOnly ? {} : validation

  const fieldOnChange = (setter: (value: string) => void) =>
    (readOnly ? undefined : ({ value }: { value: string }) => setter(value))

  const validatorProps = readOnly
    ? {}
    : {
        validators: [FormValidators.REQUIRED],
        onValidationChange,
      }

  const handleDeleteLinkClick = () => {
    setShowDeleteCollaboratorModal(true)
    toggleDeleteBool?.(false)
  }

  const handleSaveClick = () => {
    const newCollaborator = { name, eraCommonsId, title, email, approverStatus, countryOfOperation, uuid } as Collaborator
    const errors = computeCollaboratorErrors({
      collaborator: newCollaborator,
      needsApproverStatus: showApproval,
    })
    const valid = Object.keys(errors).length === 0
    onCollaboratorValidationChange({ index, validation: errors })
    if (valid) {
      saveUpdate()
    }
  }

  const handleCancelClick = () => {
    updateEditState(false)
  }

  const showDeleteTrigger = !isNil(collaborator) && !deleteMode

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card" key={`collaborator-item-${uuid}`}>
        <div className="row">
          <h2>{`${isNil(collaborator) ? 'New' : 'Edit'} ${collaboratorLabel} Information`}</h2>
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorName`}
            name="name"
            title={`${collaboratorLabel} Name`}
            defaultValue={name}
            placeholder="Firstname Lastname"
            validation={displayValidation.name}
            onChange={fieldOnChange(setName)}
          />
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorEraCommonsId`}
            name="eraCommonsId"
            title={`${collaboratorLabel} ${accountLabel} Account`}
            defaultValue={eraCommonsId}
            placeholder={`${accountLabel} Account`}
            validation={displayValidation.eraCommonsId}
            onChange={fieldOnChange(setEraCommonsId)}
          />
        </div>
        {/* title and email */}
        <div className="row">
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorTitle`}
            name="title"
            title={`${collaboratorLabel} Title`}
            defaultValue={title}
            placeholder="Title"
            validation={displayValidation.title}
            onChange={fieldOnChange(setTitle)}
          />
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorEmail`}
            name="email"
            title={`${collaboratorLabel} Email`}
            defaultValue={email}
            placeholder="Email"
            validators={readOnly ? [] : [FormValidators.REQUIRED, FormValidators.EMAIL]}
            validation={displayValidation.email}
            onChange={fieldOnChange(setEmail)}
          />
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorCountryOfOperation`}
            name="countryOfOperation"
            title={`${collaboratorLabel} Country of Operation`}
            defaultValue={countryOfOperation === '' ? null : countryOfOperation}
            placeholder="Country of Operation"
            type={FormFieldTypes.SELECT}
            selectOptions={countriesOfOperation}
            optionsAreString={true}
            validation={displayValidation.countryOfOperation}
            onChange={fieldOnChange(setCountryOfOperation)}
          />
        </div>
        {showApproval && (
          <ApproverStatus
            index={index}
            approverStatus={approverStatus}
            validation={displayValidation.approverStatus}
            onValidationChange={onValidationChange}
            onChange={({ value }) => setApproverStatus(value)}
          />
        )}
        <div className="row" style={{ marginTop: 20 }}>
          {/* Toggle Delete Buttons Cancel/Delete */}
          {showDeleteTrigger && (
            <button
              type="button"
              id={`${index}_deleteMember`}
              onClick={handleDeleteLinkClick}
              style={{
                verticalAlign: 'middle',
                lineHeight: '4rem',
                float: 'right',
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <span
                className="collaborator-delete-icon glyphicon glyphicon-trash"
                aria-hidden="true"
                data-tip="Delete dataset"
                data-for="tip_delete"
              />
              <span style={{ marginLeft: '1rem', color: '#0948B7', verticalAlign: 'middle' }}>
                Delete this entry
              </span>
            </button>
          )}
          {/* Add/Save Button */}
          <button
            type="button"
            id={`collaborator-${collaboratorKey}-add-save`}
            className="collaborator-form-add-save-button f-left btn"
            onClick={handleSaveClick}
          >
            {isNil(collaborator) ? 'Add' : 'Save'}
          </button>
          <button
            type="button"
            className="collaborator-form-cancel-button f-left btn"
            onClick={handleCancelClick}
          >
            Cancel
          </button>
          {/* Delete Modal */}
          <DeleteCollaboratorModal
            showDelete={showDeleteCollaboratorModal}
            closeDelete={closeDelete}
            header="Delete Entry"
            title={(
              <div>
                Are you sure you want to delete
                {' '}
                <strong>{name}</strong>
                {' '}
                ?
              </div>
            )}
            message={<div><i>This action is permanent and cannot be undone.</i></div>}
            onConfirm={() => deleteCollaborator?.()}
          />
        </div>
      </div>
    </div>
  )
}
