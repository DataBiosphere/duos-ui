import CollaboratorForm from './CollaboratorForm';
import CollaboratorRow from './CollaboratorRow';
import { useState, useEffect} from 'react';
import { button, div, h } from 'react-hyperscript-helpers';
import './collaborator.css';

export default function CollaboratorList(props) {
  const {formFieldChange, collaboratorLabel, collaboratorKey, showApproval} = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  const [editState, setEditState] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);

  const deleteCollaborator = (index) => {
    let collaboratorCopy = collaborators.slice();
    let editCopy = editState.slice();

    collaboratorCopy.splice(index, 1);
    editCopy.splice(index, 1);

    setEditState(editCopy);
    setCollaborators(collaboratorCopy);
  };

  const saveCollaborator = (index, newCollaborator) => {
    let newCollaborators = collaborators.slice();
    newCollaborators[index] = newCollaborator;
    setCollaborators(newCollaborators);
  };

  const updateEditState = (index, bool) => {
    let newEditState = [...editState];
    newEditState[index] = bool;
    setEditState(newEditState);
  };

  useEffect(() => {
    return formFieldChange({name: collaboratorKey, value: collaborators});
  }, [formFieldChange, collaboratorKey, collaborators]);

  useEffect(() => {
    setCollaborators(props.collaborators);
  }, [props.collaborators]);

  const ListItems = div({className: 'form-group row no-margin'}, [
    collaborators
      .map((collaborator, index) => {
        return h(CollaboratorRow, {
          index: index,
          saveCollaborator: (newCollaborator) => saveCollaborator(index, newCollaborator),
          deleteCollaborator: () => deleteCollaborator(index),
          updateEditState: (bool) => updateEditState(index, bool),
          collaborator,
          collaboratorLabel,
          showApproval,
          editMode: editState[index],
          key: collaborator?.uuid
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
        }, ['Add Collaborator']),
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
