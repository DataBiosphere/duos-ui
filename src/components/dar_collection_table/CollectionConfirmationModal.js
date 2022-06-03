import {isNil} from 'lodash/fp';
import {h} from 'react-hyperscript-helpers';
import ConfirmationModal from '../modals/ConfirmationModal';
import {isCollectionCanceled} from '../../libs/utils';
import {getProjectTitle} from './DarCollectionTable';

export default function CollectionConfirmationModal(props) {
  const {collection, showConfirmation, setShowConfirmation, cancelCollection, reviseCollection, openCollection, consoleAction} = props;

  const getModalHeader = () => {
    if(!isNil(collection)) {
      return `${collection.darCode} - ${getProjectTitle(collection)}`;
    }
    return '';
  };

  const cancelOnClick = async() => {
    await cancelCollection(collection);
    setShowConfirmation(false);
  };

  const reviseOnClick = async() => {
    await reviseCollection(collection);
    setShowConfirmation(false);
  };

  const openOnClick = async() => {
    await openCollection(collection);
    setShowConfirmation(false);
  };

  const cancelModal =
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Cancel DAR Collection',
      message: `Are you sure you want to cancel ${collection.darCode}?`,
      header: getModalHeader(),
      onConfirm: cancelOnClick
    });

  const reviseModal =
    h(ConfirmationModal, {
      showConfirmation,
      styleOverride: {height: '35%'},
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Revise DAR Collection',
      message: `Are you sure you want to revise ${collection.darCode}?`,
      header: getModalHeader(),
      onConfirm: reviseOnClick
    });

  const openModal = h(ConfirmationModal, {
    showConfirmation,
    closeConfirmation: () => setShowConfirmation(false),
    title: 'Open DAR Collection',
    message: `Are you sure you want to open ${collection.darCode}?`,
    header: getModalHeader(),
    onConfirm: openOnClick,
  });


  switch (consoleAction) {
    case 'revise':
      return reviseModal;
    case 'cancel':
      return cancelModal;
    case 'open':
      return openModal;
    //conditional used in older references, wil remove when implementation is updated
    //Logic for this old assumption is flawed since chairs in different DACs may have different actions enabled for the same collection
    //Updates will occur in later console tickets
    default:
      return isCollectionCanceled(collection) === true
        ? reviseModal
        : cancelModal;
  }

}


