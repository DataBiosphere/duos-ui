import { useState, useEffect } from 'react';
import { Navigation, Notifications } from '../../libs/utils';
import { Collections, DAC } from '../../libs/ajax';
import { div, h } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import TableTextButton from '../TableTextButton';
import { Styles } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import {
  checkIfOpenableElectionPresent,
  checkIfCancelableElectionPresent,
} from '../../utils/DarCollectionUtils';
import { isEmpty, filter, map, flow, includes, toLower, forEach, flatten} from 'lodash/fp';
import { Storage } from '../../libs/storage';
import { flatMap } from 'lodash';

const hoverOpenButtonStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER;
const baseOpenButtonStyle = Styles.TABLE.TABLE_TEXT_BUTTON;

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Styles.TABLE.TABLE_ICON_BUTTON;


const initUserData = async({roles, dars, elections}) => {
  try {
    //map out user dac ids
    const userDACs = flow(
      filter(role => !isEmpty(role.dacId)),
      map(role => role.dacId)
    )(roles);

    //NOTE: check to see if this works
    const relevantDatasets = await (userDACs.map(dacId => {
      return DAC.datasets(dacId);
    }));

    const relevantDatasetIds = flow(
      flatten,
      map(dataset => dataset.dataSetId)
    )(relevantDatasets);

    const relevantEmptyDars = flow(
      filter((dar) => isEmpty(dar.elections)),
      map((dar) => includes(dar.data.datasetIds[0](relevantDatasetIds)))
    )(dars);

    const relevantElections = filter((election) =>
      includes(election.datasetId)(relevantDatasetIds)
    )(elections);

    return {relevantEmptyDars, relevantElections};
  } catch(error) {
    throw new Error("Failed to initilize user data, redirecting to console...");
  }
};

const calcComponentState = ({dacUserId, relevantElections, relevantEmptyDars}) => {
  try{
    const nonOpenRelevantElections = [];
    const openRelevantElections = [];
    let userHasVote = false;
    let label = "Vote";

    //iterate through elections, push open and non-open elections into their respective arrays
    //also for each election, see if user has a vote and whether or not they've already voted
    forEach(election => {
      const {votes} = election;
      toLower(election.status) === 'open' ? openRelevantElections.push(election) : nonOpenRelevantElections.push(election);
      forEach(vote => {
        if(vote.dacUserId === dacUserId) {userHasVote = true;}
        if(!isEmpty(vote.vote)) { label = "Update Vote";}
      })(votes);
    })(relevantElections);

    //To determine open, see if empty dars exist or if any election is non-open
    const isOpenEnabled = (!isEmpty(relevantEmptyDars) && !isEmpty(nonOpenRelevantElections));
    //To determine cancel, see if openRelevantElections is populated
    const isCancelEnabled = !isEmpty(openRelevantElections);
    return {isCancelEnabled, userHasVote, label, isOpenEnabled};
  } catch(error) {
    throw new Error("Error initializing collection, redirecting to console...");
  }
};

export default function ChairActions(props) {
  /*
    Chair -> Admin actions plus vote button, however there are permission caveats
    //Analysis cannot be done across the entire collection, only on elections that pertain to the user

    Therefore, for opening and closing you need...
      Elections -> only the elections that pertain to the users' DAC

    For the Vote button
      Votes -> For the relevant elections (Open), see if the user has a vote (determine if vote button is disabled)
            -> See if user's vote has been submitted (Vote|Update Vote)
  */

  const { showCancelModal, updateCollections, collection } = props;
  const { dars } = collection;
  const collectionId = collection.collectionId;

  const [openEnabled, setOpenEnabled] = useState(false);
  const [cancelEnabled, setCancelEnabled] = useState(false);
  const [voteEnabled, setVoteEnabled] = useState(false);
  const [voteLabel, setVoteLabel] = useState('Vote');
  // const user = Storage.getCurrentUser;
  // const {roles, dacUserId} = user;

  useEffect(() => {
    const init = async({roles, elections, dars, dacUserId}) => {
      const {relevantEmptyDars, relevantElections} = await initUserData({roles, dars, elections});
      const {isCancelEnabled, userHasVote, label, isOpenEnabled} = calcComponentState({dacUserId, relevantElections, relevantEmptyDars});
      setOpenEnabled(isOpenEnabled);
      //To determine cancel enabled, see if any election is open
      setCancelEnabled(isCancelEnabled);
      //set label based on function return, visibility determined by setVoteEnabled
      setVoteLabel(label);
      //To determine if vote is enabled, check if user has a vote AND check that the open button is not enabled
      setVoteEnabled(userHasVote && !isOpenEnabled);
    };

    try{
      const {dars} = collection;
      const user = Storage.getCurrentUser();
      const {roles, dacUserId} = user;
      const elections = flow(
        map(dar => dar.elections),
        flatMap(electionMap => Object.values(electionMap))
      )(dars);
      init({roles, dars, dacUserId, elections});
    } catch(error) {
      Notifications.showError({text: error.message || "Error initializing component, redirecting to console..."});
      Navigation.console();
    }
  }, [dars, collection]);

  const openOnClick = async ({collectionId, updateCollections}) => {
    let updatedCollection;
    try {
      updatedCollection = await Collections.openElectionsById(collectionId);
    } catch (error) {
      Notifications.showError({ text: 'Error updating collections status' });
    }
    updateCollections(updatedCollection);
  };
}
