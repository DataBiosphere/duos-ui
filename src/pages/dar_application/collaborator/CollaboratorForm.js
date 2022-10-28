import { useState } from 'react';
import { div, h, span, a, button } from 'react-hyperscript-helpers';
import { CollaboratorSummary } from './CollaboratorSummary';
import { EditCollaborator } from './EditCollaborator';
import { computeCollaboratorErrors, CollaboratorErrors } from './CollaboratorErrors';

export const CollaboratorForm = (props) => {
  const {
    index,
  } = props;

  const [collaborator, setCollaborator] = useState(props.collaborator);
  const [editMode, setEditMode] = useState(props.collaborator.editMode);

  return div({id: index+'_collaboratorForm'}, [
    // todo: add validation/error handling (email?)
    // h(CollaboratorErrors,
    //   {
    //     errors: collaboratorValidationErrors,
    //   }),
    //
    // LOGIC
    // if the collaborator is new or being edited, return edit component
    // within the component will figure out if it is a new/update
    // if the collaborator exists and is not being edited return summary component
    ((editMode === true || editMode === undefined)
      ? h(EditCollaborator, {
        ...props,
        ...{collaborator: collaborator, setCollaborator: setCollaborator},
        ...{editMode: editMode, setEditMode: setEditMode},
      })
      // todo: this is rendering for new collaborators
      : h(CollaboratorSummary, {
        ...props,
        ...{collaborator: collaborator, id: index + '_collaborator'},
        ...{editMode: editMode, setEditMode: setEditMode},
      })
    ),
  ]);
};

export default CollaboratorForm;