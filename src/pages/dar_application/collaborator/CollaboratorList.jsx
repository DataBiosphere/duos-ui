import React, { useState, useEffect } from 'react';
import CollaboratorForm from './CollaboratorForm';
import CollaboratorRow from 'src/components/collaborator_list/CollaboratorRow';
import './collaborator.css';
import { isNil } from 'lodash';

export default function CollaboratorList(props) {
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
  } = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  const [editState, setEditState] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteBoolArray, setDeleteBoolArray] = useState(props.deleteBoolArray || []);

  const onCollaboratorValidationChange = ({index, key, validation}) => {
    if (isNil(key)) {
      onValidationChange({ key: [collaboratorKey, index], validation });
    } else {
      onValidationChange({ key: [collaboratorKey, index, key], validation });
    }
  };

  const deleteCollaborator = (index) => {
    const deleteCopy = deleteBoolArray.slice();
    const collaboratorCopy = collaborators.slice();
    const editCopy = editState.slice();

    deleteCopy.splice(index, 1);
    collaboratorCopy.splice(index, 1);
    editCopy.splice(index, 1);

    setEditState(editCopy);
    setCollaborators(collaboratorCopy);
    setDeleteBoolArray(deleteCopy);
  };

  useEffect(() => {
    setCompleted(!showNewForm && editState.every((v) => v === false));
  }, [setCompleted, showNewForm, editState]);

  const saveCollaborator = (index, newCollaborator) => {
    const newCollaborators = collaborators.slice();
    newCollaborators[index] = newCollaborator;
    setCollaborators(newCollaborators);
    const deleteBoolCopy = [...deleteBoolArray, false];
    setDeleteBoolArray(deleteBoolCopy);
  };

  const updateEditState = (index, bool) => {
    const newEditState = [...editState];
    newEditState[index] = bool;
    setEditState(newEditState);
  };

  useEffect(() => {
    return formFieldChange({key: collaboratorKey, value: collaborators});
  }, [formFieldChange, collaboratorKey, collaborators]);

  useEffect(() => {
    setCollaborators(props.collaborators);
    setDeleteBoolArray((new Array(props.collaborators.length).fill(false)));
  }, [props.collaborators, props.deleteBoolArray]);

  const ListItems = (
    <div className="form-group row no-margin">
      {collaborators.map((collaborator, index) => (
        <CollaboratorRow
          key={index}
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
            const newCollaborator = updatedCollaborators.find(c => c.uuid === collaborator.uuid) || updatedCollaborators[index];
            if (newCollaborator) {
              saveCollaborator(index, newCollaborator);
            }
          }}
          countriesOfOperation={countriesOfOperation}
          showApproverStatus={showApproval}
          // Pass validation-related props for DAR application compatibility
          validation={!isNil(validation) ? validation[index] || {} : {}}
          onCollaboratorValidationChange={onCollaboratorValidationChange}
          collaboratorKey={collaboratorKey}
        />
      ))}
    </div>
  );

  return (
    <div className="collaborator-list-component">
      <div className="row no-margin">
        {!showNewForm && <button
          id={`add-${collaboratorKey}-btn`}
          type="button" // default button element type inside a form is "submit".
          className="button button-white"
          style={{
            marginTop: 25,
            marginBottom: 5,
            ...(props.disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}),
          }}
          onClick={() => {
            if (!props.disabled) {setShowNewForm(true);}
          }}
          disabled={props.disabled}
        >
          Add {collaboratorLabel}
        </button>}
        {showNewForm && (
          <CollaboratorForm
            index={collaborators.length}
            collaboratorKey={collaboratorKey}
            saveCollaborator={(newCollaborator) => saveCollaborator(collaborators.length, newCollaborator)}
            updateEditState={(bool) => setShowNewForm(bool)}
            collaboratorLabel={collaboratorLabel}
            showApproval={showApproval}
            editMode={true}
            validation={!isNil(validation) ? validation[collaborators.length] || {} : {}}
            onCollaboratorValidationChange={onCollaboratorValidationChange}
            countriesOfOperation={countriesOfOperation}
          />
        )}
      </div>
      {ListItems}
    </div>
  );
}
