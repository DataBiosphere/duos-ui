import { a, div, span } from 'react-hyperscript-helpers';

export const CollaboratorSummary = (props) => {
  const {
    collaborator,
    index
  } = props;

  return div({}, [
    div({}, [
    ]),
    div( {
      id: index+'_summary',
      className: 'collaborator-summary-card',
    }, [
      div({
        id: index+'_name',
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        span(collaborator.name),
      ]),

      div({
        id: index+'_title',
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        span(collaborator.title),
      ]),

      div({
        id: index+'_eraCommonsId',
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        span(collaborator.eraCommonsId),
      ]),

      div({
        id: index+'_email',
        style: {
          flex: '1 1 100%',
        }
      }, [
        span(collaborator.email),
      ]),
      // Edit Button
      div({
        className: 'collaborator-summary-edit-delete-buttons',
        isRendered: !props.deleteMode,
      }, [
        a({
          id: index+'_editCollaborator',
          style: { marginLeft: 10, marginRight: 10 },
          onClick: () => {
            props.updateEditState(true);
          },
        }, [
          span({
            className: 'glyphicon glyphicon-pencil caret-margin collaborator-edit-icon', 'aria-hidden': 'true',
            'data-tip': 'Edit dataset', 'data-for': 'tip_edit'
          }),
          span({
            style: {
              marginLeft: '1rem',
            }
          }),
        ]),
        // Delete Button
        a({
          id: index+'_deleteMember',
          style: { marginLeft: 10 },
          onClick: () => props.toggleDeleteBool(true),
        }, [
          span({
            className: 'glyphicon glyphicon-trash collaborator-delete-icon',
            'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
          }),
          span({
            style: {
              marginLeft: '1rem',
            }
          }),
        ]),
      ]),
      // Delete Confirmation Buttons
      // Cancel Delete
      div({
        className: 'collaborator-summary-confirm-delete-buttons',
        isRendered: props.deleteMode,
      }, [
        a({
          id: index+'_editCollaborator',
          style: { marginLeft: 10, marginRight: 10 },
          onClick: () => props.toggleDeleteBool(false),
        }, [
          span({
            className: 'glyphicon glyphicon-remove caret-margin collaborator-cancel-delete-icon', 'aria-hidden': 'true',
            'data-tip': 'Edit dataset', 'data-for': 'tip_edit'
          }),
          span({
            style: {
              marginLeft: '1rem',
            }
          }),
        ]),
        // Confirm Delete
        a({
          id: index+'_deleteMember',
          style: { marginLeft: 10 },
          onClick: () => props.deleteCollaborator(),
        }, [
          span({
            className: 'glyphicon glyphicon-trash collaborator-confirm-delete-icon',
            'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
          }),
          span({
            style: {
              marginLeft: '1rem',
            }
          }),
        ]),
      ]),
    ]),
  ]);
};

export default CollaboratorSummary;
