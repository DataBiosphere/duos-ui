import { a, div, span } from 'react-hyperscript-helpers';

export const CollaboratorSummary = (props) => {
  const {
    collaborator,
    index
  } = props;

  const cardStyle = {
    display: 'flex',
    padding: '2% 5%',
    border: '1px solid #0948B7',
    borderRadius: '5px',
    background: '#FFFFFFFF',
    boxShadow: 'rgb(234, 227, 227) -4px 6px 9px 0px',
    marginBottom: '2%',
    margin: '1.5rem 0 1.5rem 0',
    justifyContent: 'space-around',
  };

  const editButtonStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    color: '#0948B7',
    marginTop: 25,
    padding: '0 1%',
  };

  const deleteButtonControlStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 25,
    padding: '0 1%',
  };

  return div({}, [
    div({}, [
    ]),
    div({
      id: index,

      style: cardStyle,
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
        className: 'edit-button-control',
        style: editButtonStyle
      }),
      a({
        id: index+'_editCollaborator',
        onClick: () => {
          props.updateEditState(true);
        },
      }, [
        span({
          className: 'glyphicon glyphicon-pencil caret-margin block-icon-color', 'aria-hidden': 'true',
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
        className: 'delete-button-control',
        style: deleteButtonControlStyle,
      }),
      a({
        id: index+'_deleteMember',
        onClick: () => props.deleteCollaborator(),
      }, [
        span({
          className: 'glyphicon glyphicon-trash icon-color',
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
