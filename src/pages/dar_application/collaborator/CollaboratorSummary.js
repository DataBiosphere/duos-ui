import { div, p } from 'react-hyperscript-helpers';
import {h2} from "react-hyperscript-helpers";
import {a} from "react-hyperscript-helpers";
import {span} from "react-hyperscript-helpers";
import {button} from "react-hyperscript-helpers";
import {isNil} from "lodash/fp";

export const CollaboratorSummary = (props) => {
  const {
    collaborator,
    index
  } = props;

  const cardStyle = {
    display: 'flex',
    padding: '5%',
    border: '1px solid #0948B7',
    borderRadius: '5px',
    background: '#FFFFFFFF',
    boxShadow: 'rgb(234, 227, 227) -4px 6px 9px 0px',
    // marginBottom: '2%',
    margin: '1.5rem 0 1.5rem 0',
    justifyContent: 'space-around',
  };

  const addSaveButtonStyle = {
    flex: 1,
    margin: '2px',
    border: '1px solid #0948B7',
    color: '#FFFFFFFF',
    backgroundColor: '#0948B7',
    padding: '10px 20px',
  };

  const deleteButtonControlStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 25
  };

  return div({}, [
    div({
      id: index,
      // style: {
      //   display: 'flex',
      //   justifyContent: 'space-around',
      //   margin: '1.5rem 0 1.5rem 0',
      // }
      style: cardStyle,
    }, [
      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Name']),
        collaborator.name,
      ]),

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Title']),
        collaborator.title,
      ]),

      div({
        style: {
          flex: '1 1 100%',
          marginRight: '1.5rem',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['eRA ID']),
        collaborator.eraCommonsId,
      ]),

      div({
        style: {
          flex: '1 1 100%',
        }
      }, [
        p({
          style: {
            fontWeight: 'bold',
            fontSize: '16px',
          }
        }, ['Email']),
        p({}, [
          collaborator.email,
        ]),
      ]),
      // todo: add Edit / Delete Buttons
      div({className: 'row'}, [
        div({
          className: 'delete-button-control col-lg-2 col-md-2, col-sm-2 col-xs-2 col-lg-offset-10 col-md-offset-10 col-sm-offset-10 col-xs-offset-10',
          style: deleteButtonControlStyle
        }),
        a({
          id: index+'_deleteMember',
          onClick: () => props.deleteCollaborator(),
        }, [
          span({
            className: 'cm-icon-button glyphicon glyphicon-trash',
            'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
          }),
          span({
            style: {
              marginLeft: '1rem',
            }
          }, ['Delete this entry']),
        ]),
        button({
          id: index+'_editCollaborator',
          type: 'button',
          isRendered: !collaborator.editMode && !isNil(collaborator.editMode),
          onClick: () => {
            props.setEditMode(true);
            collaborator.editMode = true;
          },
          className: 'f-right btn-primary',
          style: addSaveButtonStyle,
        }, ['Edit']),
        ///////////
        button({
          id: index+'_saveCollaborator',
          type: 'button',
          className: 'f-right btn-primary',
          style: addSaveButtonStyle,
          isRendered: collaborator.editMode,
          onClick: () => {
            props.saveCollaborator({ value: collaborator, valid: true });
            props.setEditMode(false);
            collaborator.editMode = false;
          },
        }, ['Save']),
      ]),
    ]),
  ]);
};

export default CollaboratorSummary;