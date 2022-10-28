import CollaboratorForm from './collaborator/CollaboratorForm';
import { useState, useEffect} from 'react';
import { isNil } from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { v4 as uuidV4} from 'uuid';
import { button } from 'react-hyperscript-helpers';

export default function CollaboratorList_new(props) {
  const {formFieldChange, collaboratorLabel, collaboratorKey, showApproval, onChange} = props;

  const [collaborators, setCollaborators] = useState(props.collaborators || []);
  const [deleteBoolArray, setDeleteBoolArray] = useState(props.deleteBoolArray || []);

  // todo: this fn updates individual collab attributes, move to CollaboratorForm?
  const updateAttribute = (index, key, value) => {
    let collaboratorsCopy = collaborators.slice();
    collaboratorsCopy[index][key] = value;
    setCollaborators(collaboratorsCopy);
  };

  const addCollaborator = () => {
    let newCollaborator = {
      email: '',
      name: '',
      eraCommonsId: '',
      title: '',
      uuid: uuidV4(),
      editMode: true,
      valid: false,
    };
    if (props.showApproval) {
      newCollaborator.approverStatus = true;
    }

    const updatedArray = [...collaborators, newCollaborator];
    const deleteBoolCopy = [...deleteBoolArray, false];
    setCollaborators(updatedArray);
    setDeleteBoolArray(deleteBoolCopy);
  };

  const removeCollaborator = (index) => {
    let deleteCopy = deleteBoolArray.slice();
    let collaboratorCopy = collaborators.slice();

    deleteCopy.splice(index, 1);
    collaboratorCopy.splice(index, 1);
    setCollaborators(collaboratorCopy);
    setDeleteBoolArray(deleteCopy);
  };

  const updateCollaborator = (index, newCollaborator, isValid) => {
    updateAttribute(index, 'email', newCollaborator.email);
    updateAttribute(index, 'name', newCollaborator.name);
    updateAttribute(index, 'eraCommonsId', newCollaborator.eraCommonsId);
    updateAttribute(index, 'title', newCollaborator.title);
    updateAttribute(index, 'editMode', false);
    updateAttribute(index, 'valid', isValid);
  };

  // const updateEditMode = (uuid, bool) => {
  //   let newEditMode = Object.assign({}, editMode, {[uuid]: bool});
  //   setEditMode(newEditMode);
  // };

  const startEditCollaborator = (index) => {
    collaborators[index].editMode = true;
  };

  useEffect(() => {
    return formFieldChange({name: collaboratorKey, value: collaborators});
  }, [formFieldChange, collaboratorKey, collaborators]);

  useEffect(() => {
    setCollaborators(props.collaborators);
    setDeleteBoolArray(props.deleteBoolArray);
  }, [props.collaborators, props.deleteBoolArray]);

  const ListItems = div({className: 'form-group row no-margin'}, [
    collaborators
      .map((collaborator, index) => {
        // for each collaborator, render a card (summary or edit -> new vs update)
        // each collaborator needs an editMode
        if (isNil(collaborator)) {
          return div({}, []);
        }

        return h(CollaboratorForm, {
          key: index,
          idx: index,
          saveCollaborator: (newCollaborator) => updateCollaborator(index, newCollaborator),
          deleteCollaborator: () => removeCollaborator(index),
          startEditCollaborator: () => startEditCollaborator(index),
          collaborator,
          collaboratorLabel,
          showApproval,
          onChange,
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
          style: { marginTop: 25, marginBottom: 25 },
          onClick: () => {
            !props.disabled && addCollaborator();
          }
        }, ['Add Collaborator'])
      ]),
      ListItems
    ])
  );
}
