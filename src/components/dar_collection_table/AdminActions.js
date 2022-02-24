import { useState, useEffect } from 'react';
import { Notifications } from '../../libs/utils';
import { Collections } from '../../libs/ajax';
import { isNil, toLower } from 'lodash/fp';
import { div } from 'react-hyperscript-helpers';

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

  const { collection, showCancelModal, updateCollections, style } = props;
  const collectionId = collection.collectionId;

  const [openEnabled, setOpenEnabled] = useState(false);
  const [openLabel, setOpenLabel] = useState('Open');
  const [cancelEnabled, setCancelEnabled] = useState(false);

  useEffect(() => {
    if(!isNil(collection)) {
      const { elections, dars } = collection;
      const statusTally = {
        'open': 0,
        'canceled': 0,
        'closed': 0
      };
      const electionCount = elections.size();
      const darCount = dars.size();

      elections.forEach(election => {
        const { status } = election;
        const lowerCaseStatus = toLower(status);
        if(isNil(statusTally[lowerCaseStatus])) {
          statusTally[lowerCaseStatus] = 0;
        }
        statusTally[lowerCaseStatus]++;
      });

      if(electionCount === darCount) {
        if(statusTally['open'] === 0) {
          setOpenEnabled(true);
          setCancelEnabled(false);
          setOpenLabel('Reopen');
        } else if (statusTally['open'] === electionCount) {
          setOpenEnabled(false);
          setCancelEnabled(true);
        } else if (statusTally['open'] < electionCount) {
          setOpenEnabled(false);
          setCancelEnabled(true);
        }
      } else {
        /*
          Scenario where all elections have not been genrated for a collection
          Issue can only occur with legacy data

          (Initial Thoughts)
          Open
            - If there are elections missing on DARs then the Open button should be enabled (labeled as Open Remaining or something similar)
              to generate elections ONLY for the DARs that have none
          Cancel
            - Should always be enabled, the reset-reopen flow is a good way for Admin's to reset a "broken" collection
        */
        setOpenEnabled(true);
        setOpenLabel("Open Remaining");
        setCancelEnabled(true);
      }
    }
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

  return div({className: 'admin'})

  // return {
  //   id: `collection-${collectionId}-admin-actions`,
  //   isComponent: true,
  //   label: 'admin-actions',
  //   data: template
  // }

}