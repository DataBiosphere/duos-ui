import {FormField, FormValidators} from 'src/components/forms/forms.jsx';
import React, {useEffect, useState} from 'react';
import {isEmpty, isNil} from 'lodash/fp';
import {v4 as uuidV4} from 'uuid';
import {computeCollaboratorErrors} from 'src/utils/darFormUtils.js';
import DeleteCollaboratorModal from './DeleteCollaboratorModal';
import {nihAccountLabel} from 'src/utils/ERACommonsUtils.js';
import ApproverStatus from 'src/pages/dar_application/collaborator/ApproverStatus.js';

export default function CollaboratorForm(props) {
  const {
    index,
    collaborator,
    collaboratorKey,
    validation,
    onCollaboratorValidationChange
  } = props;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [title, setTitle] = useState('');
  const [approverStatus, setApproverStatus] = useState('');
  const [uuid, setUuid] = useState('');
  const [showDeleteCollaboratorModal, setShowDeleteCollaboratorModal] = useState(false);
  const accountLabel = nihAccountLabel();

  const onValidationChange = ({key, validation}) => {
    onCollaboratorValidationChange({index, key, validation});
  };

  useEffect(() => {
    if (!isEmpty(collaborator)) {
      setName(collaborator.name);
      setEmail(collaborator.email);
      setEraCommonsId(collaborator.eraCommonsId);
      setTitle(collaborator.title);
      setApproverStatus(collaborator.approverStatus);
      setUuid(collaborator.uuid);
    } else {
      setUuid(uuidV4());
    }
  }, [collaborator]);

  const saveUpdate = () => {
    props.saveCollaborator({name, eraCommonsId, title, email, approverStatus, uuid});
    props.updateEditState(false);
  };

  const closeDelete = () => {
    setShowDeleteCollaboratorModal(false);
  };

  return (
    <div className='form-group row no-margin'>
      <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card' key={`collaborator-item-${uuid}`}>
        <div className='row'>
          <h2>{`${isNil(collaborator) ? 'New' : 'Edit'} ${props.collaboratorLabel} Information`}</h2>
          <FormField
            id={`${index}_collaboratorName`}
            name='name'
            title={`${props.collaboratorLabel} Name`}
            defaultValue={name}
            placeholder='Firstname Lastname'
            validators={[FormValidators.REQUIRED]}
            validation={validation.name}
            onValidationChange={onValidationChange}
            onChange={({value}) => setName(value)}
          />
          <FormField
            id={`${index}_collaboratorEraCommonsId`}
            name='eraCommonsId'
            title={`${props.collaboratorLabel} ${accountLabel} Account`}
            defaultValue={eraCommonsId}
            placeholder={`${accountLabel} Account`}
            validators={[FormValidators.REQUIRED]}
            validation={validation.eraCommonsId}
            onValidationChange={onValidationChange}
            onChange={({value}) => setEraCommonsId(value)}
          />
        </div>
        {/* title and email */}
        <div className='row'>
          <FormField
            id={`${index}_collaboratorTitle`}
            name='title'
            title={`${props.collaboratorLabel} Title`}
            defaultValue={title}
            placeholder='Title'
            validators={[FormValidators.REQUIRED]}
            validation={validation.title}
            onValidationChange={onValidationChange}
            onChange={({value}) => setTitle(value)}
          />
          <FormField
            id={`${index}_collaboratorEmail`}
            name='email'
            title={`${props.collaboratorLabel} Email`}
            defaultValue={email}
            placeholder='Email'
            validators={[FormValidators.REQUIRED, FormValidators.EMAIL]}
            validation={validation.email}
            onValidationChange={onValidationChange}
            onChange={({value}) => setEmail(value)}
          />
        </div>
        {props.showApproval && (
          <ApproverStatus
            index={index}
            approverStatus={approverStatus}
            validation={validation.approverStatus}
            onValidationChange={onValidationChange}
            onChange={({_key, value}) => setApproverStatus(value)}
          />
        )}
        <div className='row' style={{marginTop: 20}}>
          {/* Toggle Delete Buttons Cancel/Delete */}
          {(!isNil(props.collaborator) && !props.deleteMode) && (
            <a
              id={`${index}_deleteMember`}
              onClick={() => {
                setShowDeleteCollaboratorModal(true);
                props.toggleDeleteBool(false);
              }}
              style={{verticalAlign: 'middle', lineHeight: '4rem', float: 'right'}}
            >
              <span
                className='collaborator-delete-icon glyphicon glyphicon-trash'
                aria-hidden='true'
                data-tip='Delete dataset'
                data-for='tip_delete'
              />
              <span style={{marginLeft: '1rem', color: '#0948B7', verticalAlign: 'middle'}}>
                Delete this entry
              </span>
            </a>
          )}
          {/* Add/Save Button */}
          <div
            id={`collaborator-${collaboratorKey}-add-save`}
            className='collaborator-form-add-save-button f-left btn'
            role='button'
            onClick={() => {
              const newCollaborator = {name, eraCommonsId, title, email, approverStatus, uuid};
              const errors = computeCollaboratorErrors({
                collaborator: newCollaborator,
                needsApproverStatus: props.showApproval
              });
              const valid = Object.keys(errors).length === 0;
              onCollaboratorValidationChange({index, validation: errors});
              if (valid) {
                saveUpdate();
              }
            }}
          >
            {`${isNil(collaborator) ? 'Add' : 'Save'}`}
          </div>
          <div
            className='collaborator-form-cancel-button f-left btn'
            role='button'
            onClick={() => props.updateEditState(false)}
          >
            Cancel
          </div>
          {/* Delete Modal */}
          <DeleteCollaboratorModal
            showDelete={showDeleteCollaboratorModal}
            closeDelete={closeDelete}
            header='Delete Entry'
            title={<div>Are you sure you want to delete <strong>{name}</strong>?</div>}
            message={<div><i>This action is permanent and cannot be undone.</i></div>}
            onConfirm={() => props.deleteCollaborator()}
          />
        </div>
      </div>
    </div>
  );
}
