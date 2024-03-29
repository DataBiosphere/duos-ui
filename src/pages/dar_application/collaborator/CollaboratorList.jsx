import React from 'react';
import CollaboratorForm from './CollaboratorForm';
import CollaboratorRow from './CollaboratorRow';
import { useState, useEffect} from 'react';
import './collaborator.css';
import { isNil } from 'lodash';

export default function CollaboratorList(props) {
  const {formFieldChange, collaboratorLabel, collaboratorKey, showApproval, setCompleted, validation, onValidationChange} = props;

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
    let deleteCopy = deleteBoolArray.slice();
    let collaboratorCopy = collaborators.slice();
    let editCopy = editState.slice();

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
    let newCollaborators = collaborators.slice();
    newCollaborators[index] = newCollaborator;
    setCollaborators(newCollaborators);
    const deleteBoolCopy = [...deleteBoolArray, false];
    setDeleteBoolArray(deleteBoolCopy);
  };

  const updateEditState = (index, bool) => {
    let newEditState = [...editState];
    newEditState[index] = bool;
    setEditState(newEditState);
  };

  const toggleDeleteBool = (index, bool) => {
    let deleteCopy = [...deleteBoolArray];
    deleteCopy[index] = bool;
    setDeleteBoolArray(deleteCopy);
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
          index={index}
          saveCollaborator={(newCollaborator) => saveCollaborator(index, newCollaborator)}
          deleteCollaborator={() => deleteCollaborator(index)}
          updateEditState={(bool) => updateEditState(index, bool)}
          toggleDeleteBool={(bool) => toggleDeleteBool(index, bool)}
          collaborator={collaborator}
          collaboratorLabel={collaboratorLabel}
          showApproval={showApproval}
          editMode={editState[index]}
          key={collaborator?.uuid}
          validation={!isNil(validation) ? validation[index] || {} : {}}
          onCollaboratorValidationChange={onCollaboratorValidationChange}
          deleteMode={deleteBoolArray[index]}
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
            ...(props.disabled ? { cursor: 'not-allowed' } : {}),
          }}
          onClick={() => {
            !props.disabled && setShowNewForm(true);
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
          />
        )}
      </div>
      {ListItems}
    </div>
  );
}
