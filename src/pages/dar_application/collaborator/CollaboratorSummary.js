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
      id: index,
      className: 'collaborator-summary-card',
    }, [
      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        span(collaborator.name),
      ]),

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        span(collaborator.title),
      ]),

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        span(collaborator.eraCommonsId),
      ]),

      div({
        style: {
          flex: '1 1 100%',
        }
      }, [
        span(collaborator.email),
      ]),
      // Edit Button
      div({
        className: 'collaborator-summary-edit-button',
      }),
      a({
        id: index+'_editCollaborator',
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
      div({
        className: 'collaborator-summary-delete-button',
      }),
      a({
        id: index+'_deleteMember',
        onClick: () => props.deleteCollaborator(),
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
  ]);
};

export default CollaboratorSummary;
