import { useState, useEffect, useCallback } from "react";
import { h, div, button } from "react-hyperscript-helpers";
import { cloneDeep, findIndex } from "lodash/fp";
import { Notifications, USER_ROLES } from "../../libs/utils";
import { User, LibraryCard } from "../../libs/ajax";
import { Storage } from "../../libs/storage";
import { button } from "noty";

const deactivateLibraryCard = (props) => {
  const {deactivateLibraryCard} = props;
  return button({
    style: {}, //figure this out},
    onClick: () => deactivateLibraryCard()
  }, ['Deactivate']);
}

const LibraryCardCell = (props) => {
  const {issueNewLibraryCard, deleteLibraryCard, card} = props;
  return { 
    
  }

};

export default function SigningOfficialTable(props) {
  const [researchers, setResearchers] = useState([]);
  const [signingOfficial, setSigningOfficial] = useState({});

  //NOTE: for now mock out ajax calls so I can develop the console.
  //The back-end code needs to be updated in a separate PR

  useEffect(() => {
    const init = async() => {
      try {
        //NOTE: for now mock this ajax call so that I can design the front-end
        const researchers = await User.list(USER_ROLES.signingOfficial);
        const signingOfficial = Storage.getCurrentUser();
        setResearchers(researchers);
        setSigningOfficial(signingOfficial);
      } catch(error) {
        Notifications.showError({text: 'Failed to initialie Signing Table Console'});
      }
    };
    init();
  }, []);

  const issueNewLibraryCard = useCallback(async (targetResearcher) => {
    const { eraCommonsId, dacUserId, displayName, email } = targetResearcher;
    const { institutionId } = signingOfficial;
    try {
      const listCopy = cloneDeep(researchers);
      const newLibraryCard = LibraryCard.createLibraryCard({
        institutionId,
        eraCommonsId,
        email,
        userId: dacUserId,
        userName: displayName
      });

      const targetIndex = findIndex((researcher) => targetResearcher.dacUserId === researcher.dacUserId)(listCopy);
      //library cards array should only have one card MAX, SO should not be able to see LCs from other institutions
      listCopy[targetIndex].libraryCards = [newLibraryCard];
      setResearchers(listCopy);
      Notifications.showSuccess({text: `Issued new library card to ${displayName}`});
    } catch(error) {
      Notifications.showError({text: `Error issuing library card to ${displayName}`});
    }
  }, [signingOfficial, researchers]);

  const deactivateLibraryCard = useCallback(async (id, displayName, dacUserId) => {
    const listCopy = cloneDeep(researchers);
    try {
      await LibraryCard.deleteLibraryCard(id);
      const targetIndex = findIndex((researcher) => dacUserId === researcher.dacUserId)(researchers);
      listCopy[targetIndex].libraryCards = [];
      setResearchers(listCopy);
      Notifications.showSuccess({text: `Removed library card issued to ${displayName}`});
    } catch(error) {
      Notifications.showError({text: `Error deleting library card issued to ${displayName}`});
    }
  }, [researchers]);
}