import React from 'react';
import {isNil} from 'lodash/fp';
import ConfirmationModal from '../modals/ConfirmationModal';
import {isCollectionCanceled} from '../../libs/utils';

export default function CollectionConfirmationModal(props) {
  const { collection, showConfirmation, setShowConfirmation, cancelCollection, reviseCollection, openCollection, consoleAction, deleteDraft } = props;

  const getModalHeader = (collection) => {
    if (!isNil(collection)) {
      return `${collection.darCode} - ${collection.name}`;
    }
    return '';
  };

  const cancelOnClick = async () => {
    await cancelCollection(collection);
    setShowConfirmation(false);
  };

  const reviseOnClick = async () => {
    await reviseCollection(collection);
    setShowConfirmation(false);
  };

  const openOnClick = async () => {
    await openCollection(collection);
    setShowConfirmation(false);
  };

  const deleteOnClick = async () => {
    await deleteDraft(collection);
    setShowConfirmation(false);
  };

  const cancelModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Cancel Data Access Request"
      message={`Are you sure you want to cancel ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={cancelOnClick}
    />
  );

  const reviseModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      styleOverride={{ height: '35%' }}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Revise Data Access Request"
      message={`Are you sure you want to revise ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={reviseOnClick}
    />
  );

  const openModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Open Data Access Request"
      message={`Are you sure you want to open ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={openOnClick}
    />
  );

  const deleteModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      styleOverride={{ height: '35%' }}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Delete Data Access Request Draft"
      message={`Are you sure you want to delete ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={deleteOnClick}
    />
  );

  switch (consoleAction) {
    case 'revise':
      return reviseModal;
    case 'cancel':
      return cancelModal;
    case 'open':
      return openModal;
    case 'delete':
      return deleteModal;
    // conditional used in older references, will remove when implementation is updated
    // Logic for this old assumption is flawed since chairs in different DACs may have different actions enabled for the same collection
    // Updates will occur in later console tickets
    default:
      return isCollectionCanceled(collection) === true ? reviseModal : cancelModal;
  }
}
