import { a, h, div, span } from 'react-hyperscript-helpers';
import { useState } from 'react';
import ConfirmationModal from '/Users/koflaher/Code/duos-ui/src/components/modals/ConfirmationModal.js';

export const CollaboratorSummary = (props) => {
  const {
    collaborator,
    index
  } = props;

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const closeConfirmation = () => {
    setShowConfirmationModal(false);
  };

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
          onClick: () => setShowConfirmationModal(true),
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
        // Delete Confirmation Modal
        h(ConfirmationModal, {
          showConfirmation: showConfirmationModal,
          closeConfirmation: closeConfirmation,
          title: 'Delete entry?',
          message: 'Are you sure you want to delete this entry?',
          onConfirm: () => props.deleteCollaborator(),
        })
      ]),
    ]),
  ]);
};

export default CollaboratorSummary;
