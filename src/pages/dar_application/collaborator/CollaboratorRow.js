import { CollaboratorSummary } from './CollaboratorSummary';
import { div, h } from 'react-hyperscript-helpers';
import CollaboratorForm from './CollaboratorForm';

export const CollaboratorRow = (props) => {
  const {
    index,
  } = props;

  return div({id: index+'_collaboratorForm'}, [
    h(CollaboratorForm, {
      ...props,
      collaborator: props.collaborator, index: index,
      isRendered: props.editMode === true
    }),
    h(CollaboratorSummary, {
      ...props,
      collaborator: props.collaborator, index: index,
      isRendered: !props.editMode
    })
  ]);
};

export default CollaboratorRow;
