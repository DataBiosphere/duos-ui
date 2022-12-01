import CollaboratorForm from './CollaboratorForm';
import CollaboratorRow from './CollaboratorRow';
import { useState, useEffect} from 'react';
import { button, div, h } from 'react-hyperscript-helpers';
import './collaborator.css';

export default function CollaboratorList_new(props) {
  const {formFieldChange, collaboratorLabel, collaboratorKey, showApproval, setCompleted} = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  const [editState, setEditState] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteBoolArray, setDeleteBoolArray] = useState(props.deleteBoolArray || []);

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
  });

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
    return formFieldChange({name: collaboratorKey, value: collaborators});
  }, [formFieldChange, collaboratorKey, collaborators]);

  useEffect(() => {
    setCollaborators(props.collaborators);
    setDeleteBoolArray((new Array(props.collaborators.length).fill(false)));
  }, [props.collaborators, props.deleteBoolArray]);

  const ListItems = div({className: 'form-group row no-margin'}, [
    collaborators
      .map((collaborator, index) => {
        return h(CollaboratorRow, {
          index: index,
          saveCollaborator: (newCollaborator) => saveCollaborator(index, newCollaborator),
          deleteCollaborator: () => deleteCollaborator(index),
          updateEditState: (bool) => updateEditState(index, bool),
          toggleDeleteBool: (bool) => toggleDeleteBool(index, bool),
          collaborator,
          collaboratorLabel,
          showApproval,
          editMode: editState[index],
          key: collaborator?.uuid,
          deleteMode: deleteBoolArray[index]
        });
      })
  ]);

  return (
    div({className: 'collaborator-list-component'}, [
      div({className: 'row no-margin'}, [
        button({
          id: 'add-collaborator-btn access-background',
          type: 'button', // default button element type inside a form is "submit".
          className: 'button button-white',
          style: { marginTop: 25, marginBottom: 5 },
          onClick: () => {
            !props.disabled && setShowNewForm(true);
          },
          isRendered: !showNewForm
        }, [`Add ${collaboratorLabel}`]),
        h(CollaboratorForm, {
          index: collaborators.length,
          saveCollaborator: (newCollaborator) => saveCollaborator(collaborators.length, newCollaborator),
          updateEditState: (bool) => setShowNewForm(bool),
          isRendered: showNewForm,
          collaboratorLabel,
          showApproval,
          editMode: true,
        }),
      ]),
      ListItems
    ])
  );
}
