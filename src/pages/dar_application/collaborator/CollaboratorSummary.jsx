import React from 'react';
import { useState } from 'react';
import DeleteCollaboratorModal from './DeleteCollaboratorModal';

export const CollaboratorSummary = (props) => {
  const {
    collaborator,
    index
  } = props;

  const [showDeleteCollaboratorModal, setShowDeleteCollaboratorModal] = useState(false);
  const closeDelete = () => {
    setShowDeleteCollaboratorModal(false);
  };

  return (
    <div>
      <div></div>
      <div id={index+'_summary'} className='collaborator-summary-card'>
        <div id={index+'_name'} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
          <span>{collaborator.name}</span>
        </div>
        <div id={index+'_title'} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
          <span>{collaborator.title}</span>
        </div>
        <div id={index+'_eraCommonsId'} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
          <span>{collaborator.eraCommonsId}</span>
        </div>
        <div id={index+'_email'} style={{ flex: '1 1 100%' }}>
          <span>{collaborator.email}</span>
        </div>
        {/* Edit Button */}
        {!props.deleteMode && <div className='collaborator-summary-edit-delete-buttons'>
          <a
            id={index+'_editCollaborator'}
            style={{ marginLeft: 10, marginRight: 10 }}
            onClick={() => {
              props.updateEditState(true);
            }}
          >
            <span
              className='glyphicon glyphicon-pencil caret-margin collaborator-edit-icon'
              aria-hidden='true'
              data-tip='Edit dataset'
              data-for='tip_edit'
            ></span>
            <span style={{ marginLeft: '1rem' }}></span>
          </a>
          {/* Delete Button */}
          <a
            id={index+'_deleteMember'}
            style={{ marginLeft: 10 }}
            onClick={() => {
              setShowDeleteCollaboratorModal(true);
              props.toggleDeleteBool(false);
            }}
          >
            <span
              className='glyphicon glyphicon-trash collaborator-delete-icon'
              aria-hidden='true'
              data-tip='Delete dataset'
              data-for='tip_delete'
            ></span>
            <span style={{ marginLeft: '1rem' }}></span>
          </a>
          {/* Delete Modal */}
          <DeleteCollaboratorModal
            showDelete={showDeleteCollaboratorModal}
            closeDelete={closeDelete}
            header='Delete Entry'
            title={<div>Are you sure you want to delete <strong>{collaborator.name}</strong>?</div>}
            message={<div><i>This action is permanent and cannot be undone.</i></div>}
            onConfirm={() => props.deleteCollaborator()}
          />
        </div>}
      </div>
    </div>
  );
};

export default CollaboratorSummary;
