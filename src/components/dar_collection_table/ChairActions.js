import { useState, useEffect } from 'react';
import { Notifications } from '../../libs/utils';
import { Collections, DAC } from '../../libs/ajax';
import { div, h } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import TableTextButton from '../TableTextButton';
import { Styles } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import { isEmpty, isNil, filter, map, flow, includes, toLower, forEach, flatten, flatMap, uniq} from 'lodash/fp';
import { Storage } from '../../libs/storage';

const hoverTextButtonStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER;
const baseTextButtonStyle = Styles.TABLE.TABLE_TEXT_BUTTON;

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Styles.TABLE.TABLE_ICON_BUTTON;

const initUserData = async({roles, dars, elections}) => {
  try {
    //map out user dac ids
    const userDACs = flow(
      filter(role => !isNil(role.dacId)),
      map(role => role.dacId)
    )(roles);

    //NOTE: an API endpoint for batch call would be useful here
    const relevantDatasets = await (userDACs.map(dacId => {
      return DAC.datasets(dacId);
    }));

    const relevantDatasetIds = flow(
      flatten,
      map(dataset => dataset.dataSetId),
      uniq
    )(relevantDatasets);
    const relevantEmptyDars = filter(dar => {
      if(isEmpty(dar.elections)){ return false; }
      const datasetId = !isEmpty(dar.data) ? dar.data.datasetIds[0] : undefined;
      return includes(datasetId)(relevantDatasetIds);
    })(dars);
    const relevantElections = filter((election) =>
      includes(election.datasetId)(relevantDatasetIds)
    )(elections);
    return {relevantEmptyDars, relevantElections, relevantDatasetIds};
  } catch(error) {
    //if there's an issue with the collection it's best to fail safely, so hide all of the buttons
    throw new Error('Error initializing component data');
  }
};

const calcComponentState = ({dacUserId, relevantElections, relevantEmptyDars, relevantDatasetIds}) => {
  try{
    const nonOpenRelevantElections = [];
    const openRelevantElections = [];
    let userHasVote = false;
    let label = "Vote";

    //iterate through elections, push open and non-open elections into their respective arrays
    //also for each election, see if user has a vote and whether or not they've already voted
    forEach(election => {
      if(includes(election.datasetId)(relevantDatasetIds)) {
        const {votes} = election;
        toLower(election.status) === 'open' ? openRelevantElections.push(election) : nonOpenRelevantElections.push(election);
        forEach(vote => {
          if(vote.dacUserId === dacUserId) {userHasVote = true;}
          if(!isEmpty(vote.vote)) { label = "Update Vote";}
        })(votes);
      }
    })(relevantElections);
    //To determine open, see if empty dars exist or if any election is non-open
    const isOpenEnabled = (!isEmpty(relevantEmptyDars) || !isEmpty(nonOpenRelevantElections));
    //To determine cancel, see if openRelevantElections is populated
    const isCancelEnabled = !isEmpty(openRelevantElections);
    return {isCancelEnabled, userHasVote, label, isOpenEnabled};
  } catch(error) {
    throw new Error ('Error initializing chair actions');
  }
};

export default function ChairActions(props) {
  /*
    Chair -> Admin actions plus vote button, however there are permission caveats
    //Analysis cannot be done across the entire collection, only on elections that pertain to the user

    Therefore, for opening and closing you need...
      Elections -> only the elections that pertain to the users' DAC

    For the Vote button
      Votes -> For the relevant elections (Open), see if the user has a vote (need this to figure out if vote is hidden)
            -> See if user's vote has been submitted (Vote|Update Vote)
  */

  const { showCancelModal, updateCollections, collection } = props;
  const { dars } = collection;
  const collectionId = collection.collectionId;

  const [openEnabled, setOpenEnabled] = useState(false);
  const [cancelEnabled, setCancelEnabled] = useState(false);
  const [voteEnabled, setVoteEnabled] = useState(false);
  const [voteLabel, setVoteLabel] = useState('Vote');

  //if there's something wrong with the collection it's best to fail grecefully
  //use this function to hide buttons on processing err
  const updateStateOnFail = () => {
    setOpenEnabled(false);
    setCancelEnabled(false);
    setVoteLabel(false);
  };

  useEffect(() => {
    const init = async({roles, elections, dars, dacUserId}) => {
      const {relevantEmptyDars, relevantElections, relevantDatasetIds} = await initUserData({roles, dars, elections});
      const {isCancelEnabled, userHasVote, label, isOpenEnabled} = calcComponentState({dacUserId, relevantElections, relevantEmptyDars, relevantDatasetIds});
      setOpenEnabled(isOpenEnabled);
      //To determine cancel enabled, see if any election is open
      setCancelEnabled(isCancelEnabled);
      //set label based on function return, visibility determined by setVoteEnabled
      setVoteLabel(label);
      //To determine if vote is enabled, check if user has a vote AND check that the open button is not enabled
      setVoteEnabled((userHasVote && !isOpenEnabled));
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
      updateStateOnFail();
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

  const goToVote = (collectionId) => {
    history.push(`/dar_collection/${collectionId}`);
  };

  const cancelOnClick = (collection) => {
    showCancelModal(collection);
  };

  const openButtonAttributes = {
    keyProp: `chair-open-${collectionId}`,
    label: 'Open',
    isRendered: openEnabled,
    onClick:() => openOnClick({collectionId, updateCollections}),
    style: baseTextButtonStyle,
    hoverStyle: hoverTextButtonStyle
  };

  const cancelButtonAttributes = {
    keyProp: `chair-cancel-${collectionId}`,
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block
  };

  const voteButtonAttributes = {
    keyProp: `chair-vote-${collectionId}`,
    label: voteLabel,
    isRendered: voteEnabled,
    onClick: () => goToVote(collectionId),
    style: baseTextButtonStyle,
    hoverStyle: hoverTextButtonStyle,
  };

  return div({
    className: 'chair-actions',
    key: `chair-actions-${collectionId}`,
    style: {
      display: 'flex',
      padding: '10px 5px',
      justifyContent: 'space-around',
      alignItems: 'end'
    }
  }, [
    h(TableTextButton, openButtonAttributes),
    h(TableTextButton, voteButtonAttributes),
    h(TableIconButton, cancelButtonAttributes),
  ]);
}
