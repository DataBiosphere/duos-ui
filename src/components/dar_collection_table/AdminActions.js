import { useState, useEffect } from 'react';
import { Notifications } from '../../libs/utils';
import { Collections } from '../../libs/ajax';
import { div, h} from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import TableTextButton from '../TableTextButton';
import { Styles } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import { checkIfOpenableElectionPresent, checkIfCancelableElectionPresent } from '../../utils/DarCollectionUtils';

const hoverOpenButtonStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER;
const baseOpenButtonStyle = Styles.TABLE.TABLE_TEXT_BUTTON;

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Styles.TABLE.TABLE_ICON_BUTTON;

export default function AdminActions(props) {
  /*
    Admin -> Should only be able to open and close elections (no restrictions in terms of permissions)
    Cancel should be unrestricted, should be able to run no matter what
    Open should only happen if there's no election
    Re-open should pop up if the latest elections are all closed/cancelled (mix should not be possible)

    Therefore, to make the above calculations, you'll need...
      Elections -> all elections in the collection
      Votes -> Not needed? Votes are attached to the election regardless
  */

  /*
    setCollections -> state setter from parent
    collections -> state variable from parent
    collection -> target collection for the button
  */

  const { collection, showCancelModal, updateCollections } = props;
  const collectionId = collection.collectionId;

  const [openEnabled, setOpenEnabled] = useState(false);
  const [cancelEnabled, setCancelEnabled] = useState(false);

  useEffect(() => {
    const isCancelable = checkIfCancelableElectionPresent(collection);
    const isOpenable = checkIfOpenableElectionPresent(collection);

    setOpenEnabled(isOpenable);
    setCancelEnabled(isCancelable);
  }, [collection]);
  /*
    updateCollections should be a method defined on the Admin console
    should look something like this...

    const updateCollections = (updatedCollection) => {
      const collectionIndex = findIndex(collection => collection.collectionId === updatedCollection.collectionId);
      try {
        if(!isNil(collectionIndex)) {
          const updatedCollection = await Collections.openElectionsById(collectionId);
          const collectionsCopy = collections.slice();
          collectionsCopy[collectionIndex] = updatedCollection;
          setCollections(collections);
        }
        const collectionsCopy = collections.slice() //assume collections is the state variable on parent
      } catch(error) {
        Notifications.showError({text: 'Error updating collection statuses})
      }
    }
  */

  const openOnClick = async (collectionId) => {
    let updatedCollection;
    try {
      updatedCollection = await Collections.openElectionsById(collectionId);
    } catch(error) {
      Notifications.showError({text: "Error updating collections status"});
    }
    updateCollections(updatedCollection);
  };

  const cancelOnClick = (collection) => {
    //showCancelModal should be defined on the Admin Console.
    showCancelModal(collection);
  };

  const openButtonAttributes = {
    keyProp: `admin-open-${collectionId}`,
    label: 'Open',
    isRendered: openEnabled,
    onClick: () => openOnClick(collectionId),
    style: baseOpenButtonStyle,
    hoverStyle: hoverOpenButtonStyle,
  };

  const cancelButtonAttributes = {
    keyProp: `admin-cancel-${collectionId}`,
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block
  };

  return div({
    className: 'admin-actions',
    key: `admin-actions-${collectionId}`,
    style: {
      display: 'flex',
      padding: '10px 5px',
      justifyContent: 'space-around',
      alignItems: 'end'
    }
  }, [
    h(TableTextButton, openButtonAttributes),
    h(TableIconButton, cancelButtonAttributes)
  ]);
}