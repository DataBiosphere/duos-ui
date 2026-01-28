import {
  FormField,
  FormFieldTypes,
  FormValidators,
} from 'src/components/forms/forms.jsx'
import React, { useEffect, useState } from 'react'
import { isEmpty, isNil } from 'lodash'
import { v4 as uuidV4 } from 'uuid'
import { computeCollaboratorErrors } from 'src/utils/darFormUtils'
import DeleteCollaboratorModal from './DeleteCollaboratorModal'
import { nihAccountLabel } from 'src/components/era_commons/ERACommonsUtils'
import ApproverStatus from 'src/pages/dar_application/collaborator/ApproverStatus'
import { Countries } from 'src/libs/ajax/Countries'

export default function CollaboratorForm(props) {
  const {
    index,
    collaborator,
    collaboratorKey,
    countriesOfOperation,
    validation,
    onCollaboratorValidationChange,
    readOnly = false,
  } = props

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eraCommonsId, setEraCommonsId] = useState('')
  const [title, setTitle] = useState('')
  const [approverStatus, setApproverStatus] = useState('')
  const [uuid, setUuid] = useState('')
  const [showDeleteCollaboratorModal, setShowDeleteCollaboratorModal] = useState(false)
  const accountLabel = nihAccountLabel()
  const [countryOfOperation, setCountryOfOperation] = useState('')

  const onValidationChange = ({ key, validation }) => {
    onCollaboratorValidationChange({ index, key, validation })
  }

  useEffect(() => {
    const init = async () => {
      if (!isEmpty(collaborator)) {
        setName(collaborator.name)
        setEmail(collaborator.email)
        setEraCommonsId(collaborator.eraCommonsId)
        setTitle(collaborator.title)
        setApproverStatus(collaborator.approverStatus)
        setUuid(collaborator.uuid)
        setCountryOfOperation(collaborator.countryOfOperation)
      }
      else {
        setUuid(uuidV4())
        setCountryOfOperation(Countries.DEFAULT_COUNTRY)
      }
    }
    init()
  }, [collaborator])

  const saveUpdate = () => {
    props.saveCollaborator({ name, eraCommonsId, title, email, approverStatus, uuid, countryOfOperation })
    props.updateEditState(false)
  }

  const closeDelete = () => {
    setShowDeleteCollaboratorModal(false)
  }

  const validatorProps = readOnly
    ? {}
    : {
        validators: [FormValidators.REQUIRED],
        onValidationChange,
      }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card" key={`collaborator-item-${uuid}`}>
        <div className="row">
          <h2>{`${isNil(collaborator) ? 'New' : 'Edit'} ${props.collaboratorLabel} Information`}</h2>
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorName`}
            name="name"
            title={`${props.collaboratorLabel} Name`}
            defaultValue={name}
            placeholder="Firstname Lastname"
            validation={!readOnly ? validation.name : {}}
            onChange={!readOnly ? ({ value }) => setName(value) : null}
          />
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorEraCommonsId`}
            name="eraCommonsId"
            title={`${props.collaboratorLabel} ${accountLabel} Account`}
            defaultValue={eraCommonsId}
            placeholder={`${accountLabel} Account`}
            validation={!readOnly ? validation.eraCommonsId : {}}
            onChange={!readOnly ? ({ value }) => setEraCommonsId(value) : null}
          />
        </div>
        {/* title and email */}
        <div className="row">
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorTitle`}
            name="title"
            title={`${props.collaboratorLabel} Title`}
            defaultValue={title}
            placeholder="Title"
            validation={!readOnly ? validation.title : {}}
            onChange={!readOnly ? ({ value }) => setTitle(value) : null}
          />
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorEmail`}
            name="email"
            title={`${props.collaboratorLabel} Email`}
            defaultValue={email}
            placeholder="Email"
            validators={!readOnly ? [FormValidators.REQUIRED, FormValidators.EMAIL] : []}
            validation={!readOnly ? validation.email : {}}
            onChange={!readOnly ? ({ value }) => setEmail(value) : null}
          />
          <FormField
            {...validatorProps}
            id={`${index}_collaboratorCountryOfOperation`}
            name="countryOfOperation"
            title={`${props.collaboratorLabel} Country of Operation`}
            defaultValue={countryOfOperation === '' ? null : countryOfOperation}
            placeholder="Country of Operation"
            type={FormFieldTypes.SELECT}
            selectOptions={countriesOfOperation}
            optionsAreString={true}
            validation={!readOnly ? validation.countryOfOperation : {}}
            onChange={!readOnly ? ({ value }) => setCountryOfOperation(value) : null}
          />
        </div>
        {props.showApproval && (
          <ApproverStatus
            index={index}
            approverStatus={approverStatus}
            validation={!readOnly ? validation.approverStatus : {}}
            onValidationChange={onValidationChange}
            onChange={({ _key, value }) => setApproverStatus(value)}
          />
        )}
        <div className="row" style={{ marginTop: 20 }}>
          {/* Toggle Delete Buttons Cancel/Delete */}
          {(!isNil(props.collaborator) && !props.deleteMode) && (
            <a
              id={`${index}_deleteMember`}
              onClick={() => {
                setShowDeleteCollaboratorModal(true)
                props.toggleDeleteBool(false)
              }}
              style={{ verticalAlign: 'middle', lineHeight: '4rem', float: 'right' }}
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
            </a>
          )}
          {/* Add/Save Button */}
          <div
            id={`collaborator-${collaboratorKey}-add-save`}
            className="collaborator-form-add-save-button f-left btn"
            role="button"
            onClick={() => {
              const newCollaborator = { name, eraCommonsId, title, email, approverStatus, countryOfOperation, uuid }
              const errors = computeCollaboratorErrors({
                collaborator: newCollaborator,
                needsApproverStatus: props.showApproval,
              })
              const valid = Object.keys(errors).length === 0
              onCollaboratorValidationChange({ index, validation: errors })
              if (valid) {
                saveUpdate()
              }
            }}
          >
            {`${isNil(collaborator) ? 'Add' : 'Save'}`}
          </div>
          <div
            className="collaborator-form-cancel-button f-left btn"
            role="button"
            onClick={() => props.updateEditState(false)}
          >
            Cancel
          </div>
          {/* Delete Modal */}
          <DeleteCollaboratorModal
            showDelete={showDeleteCollaboratorModal}
            closeDelete={closeDelete}
            header="Delete Entry"
            title={(
              <div>
                Are you sure you want to delete
                <strong>{name}</strong>
                ?
              </div>
            )}
            message={<div><i>This action is permanent and cannot be undone.</i></div>}
            onConfirm={() => props.deleteCollaborator()}
          />
        </div>
      </div>
    </div>
  )
}
