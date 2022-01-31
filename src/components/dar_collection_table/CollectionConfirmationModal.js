import {isNil} from "lodash/fp";
import {h} from "react-hyperscript-helpers";
import ConfirmationModal from "../modals/ConfirmationModal";
import {isCollectionCanceled} from "../../libs/utils";
import {getProjectTitle} from "./DarCollectionTable";

export default function CollectionConfirmationModal(props) {
  const {collection, showConfirmation, setShowConfirmation, cancelCollection, resubmitCollection} = props;

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

  const resubmitOnClick = async() => {
    await resubmitCollection(collection);
    setShowConfirmation(false);
  };

  const cancelModal = () =>
    h(ConfirmationModal, {
      showConfirmation,
      styleOverride: {height: '35%'},
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Cancel DAR Collection',
      message: `Are you sure you want to cancel ${collection.darCode}?`,
      header: getModalHeader,
      onConfirm: cancelOnClick
    });

  const resubmitModal = () =>
    h(ConfirmationModal, {
      showConfirmation,
      styleOverride: {height: '35%'},
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Resubmit DAR Collection',
      message: `Are you sure you want to resubmit ${collection.darCode}?`,
      header: getModalHeader,
      onConfirm: resubmitOnClick
    });


  return isCollectionCanceled(collection) === true ? resubmitModal() : cancelModal();
}


