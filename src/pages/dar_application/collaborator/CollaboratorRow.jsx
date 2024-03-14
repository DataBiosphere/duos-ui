import React from 'react';
import { CollaboratorSummary } from './CollaboratorSummary';
import CollaboratorForm from './CollaboratorForm';

export const CollaboratorRow = (props) => {
  const {
    index,
    validation,
    onCollaboratorValidationChange,
    collaborator,
    editMode,
  } = props;

  return (
    <div id={index + '_collaboratorForm'}>
      {editMode === true && <CollaboratorForm
        {...props}
        collaborator={collaborator}
        index={index}
        validation={validation}
        onCollaboratorValidationChange={onCollaboratorValidationChange}
      />}
      {!editMode && <CollaboratorSummary
        {...props}
        collaborator={collaborator}
        index={index}
      />}
    </div>
  );
};

export default CollaboratorRow;
