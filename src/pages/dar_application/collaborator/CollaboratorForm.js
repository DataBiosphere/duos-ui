import { useState } from 'react';
import { div, h, span, a, button } from 'react-hyperscript-helpers';
import {v4 as uuidV4} from 'uuid';
import { CollaboratorSummary } from './CollaboratorSummary';
import { EditCollaborator } from './EditCollaborator';
import { computeCollaboratorErrors, CollaboratorErrors } from './CollaboratorErrors';

export const CollaboratorForm = (props) => {
  const {
    idx,
    saveCollaborator,
    deleteCollaborator,
  } = props;

  const [collaborator, setCollaborator] = useState({
    name: '',
    title: '',
    eraCommonsId: '',
    email: '',
    uuid: uuidV4()
  });

  const [collaboratorValidationErrors, setCollaboratorValidationErrors] = useState([]);
  const [editMode, setEditMode] = useState(true);

  return div({
    style: {
      border: '1px solid #283593',
      padding: '1rem 2rem 1rem 2rem',
      borderRadius: '4px',
      marginBottom: '2rem',
    },
    id: idx+'_collaboratorForm'
  }, [

    h(CollaboratorErrors,
      {
        errors: collaboratorValidationErrors,
      }),

    (editMode
      ? h(EditCollaborator, {
        ...props,
        ...{collaborator: collaborator, setCollaborator: setCollaborator},
      })
      : h(CollaboratorSummary, {
        ...props,
        ...{collaborator: collaborator, id: idx+'_collaborator'},
      })),

    // save + delete
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '2rem',
      }
    }, [
      a({
        id: idx+'_deleteCollaborator',
        onClick: () => deleteCollaborator(),
      }, [
        span({
          className: 'cm-icon-button glyphicon glyphicon-trash',
          'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
        }),
        span({
          style: {
            marginLeft: '1rem',
          }
          // todo: only display this message with add (not edit)
        }, ['Delete this entry']),
      ]),
      div({}, [
        button({
          id: idx+'_editCollaborator',
          type: 'button',
          isRendered: !editMode,
          onClick: () => {
            setEditMode(true);
          },
          className: 'f-right btn-primary common-background',
        }, ['Edit']),

        button({
          id: idx+'_saveCollaborator',
          type: 'button',
          isRendered: editMode,
          onClick: () => {
            const errors = computeCollaboratorErrors(collaborator);
            const valid = errors.length === 0;

            setCollaboratorValidationErrors(errors);

            if (valid) {
              saveCollaborator({ value: collaborator, valid: true });
              setEditMode(false);
            }
          },
          className: 'f-right btn-primary common-background',
        }, ['Save']),
      ]),
    ])
  ]);
};

export default CollaboratorForm;