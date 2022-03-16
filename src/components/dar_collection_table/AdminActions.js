import { useState, useEffect } from 'react';
import { div, h} from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import SimpleButton from '../SimpleButton';
import { Styles, Theme } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import { checkIfOpenableElectionPresent, checkIfCancelableElectionPresent } from '../../utils/DarCollectionUtils';

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON, {alignItems: 'center'});

export default function AdminActions(props) {
  /*
    Admin -> Should only be able to open and close elections (no restrictions in terms of permissions)
    Cancel should be unrestricted, should be able to run no matter what
    Open should only happen if there's no election
    Re-open should pop up if the latest elections are all closed/cancelled (mix should not be possible)

    Therefore, to make the above calculations, you'll need...
      Elections -> all elections in the collection
  */

  /*
    setCollections -> state setter from parent
    collections -> state variable from parent
    collection -> target collection for the button
  */

  const { collection, showConfirmationModal, openCollection } = props;
  const collectionId = collection.darCollectionId;
  const [openEnabled, setOpenEnabled] = useState(false);
  const [cancelEnabled, setCancelEnabled] = useState(false);

  useEffect(() => {
    const { dars } = collection;
    const isCancelable = checkIfCancelableElectionPresent(dars);
    const isOpenable = checkIfOpenableElectionPresent(dars);

    setOpenEnabled(isOpenable);
    setCancelEnabled(isCancelable);
  }, [collection]);
  /*
    updateCollections should be a method defined on the Admin console
    Should look something close to below, expect similar requirements on the other actions for things like cancel, revise, etc.

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
    openCollection(collectionId);
  };

  const cancelOnClick = (collection) => {
    showConfirmationModal(collection, 'cancel');
  };

  const openButtonAttributes = {
    keyProp: `admin-open-${collectionId}`,
    label: 'Open',
    isRendered: openEnabled,
    onClick: () => openOnClick(collection),
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '5px 10px',
      fontSize: '1.45rem'
    }
  };

  const cancelButtonAttributes = {
    keyProp: `admin-cancel-${collectionId}`,
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block,
  };

  return div(
    {
      className: 'admin-actions',
      key: `admin-actions-${collectionId}`,
      style: {
        display: 'flex',
        padding: '10px 0px',
        alignItems: 'end',
        justifyContent: 'space-between'
      },
    },
    [
      h(SimpleButton, openButtonAttributes),
      h(TableIconButton, cancelButtonAttributes),
    ]
  );
}