import { useState, useEffect } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Styles, Theme } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import { isEmpty, filter, map, flow, includes, toLower, forEach, flatten, flatMap, uniq } from 'lodash/fp';
import { Storage } from '../../libs/storage';
import SimpleButton from '../SimpleButton';

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign(
  {},
  Styles.TABLE.TABLE_ICON_BUTTON,
  { alignItems: 'center' }
);

const initUserData = ({dars, elections, relevantDatasets}) => {
  try {
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
    let nonOpenReleventElectionPresent = false;
    let openRelevantElectionPresent = false;
    let userHasVote = false;
    let label = "Vote";

    //iterate through elections, push open and non-open elections into their respective arrays
    //also for each election, see if user has a vote and whether or not they've already voted
    forEach(election => {
      if(includes(election.datasetId)(relevantDatasetIds)) {
        const {votes, status} = election;
        const isElectionOpen = toLower(status) === 'open';
        isElectionOpen ? openRelevantElectionPresent = true : nonOpenReleventElectionPresent = true;
        forEach(vote => {
          if(vote.dacUserId === dacUserId && isElectionOpen) {userHasVote = true;}
          if(!isEmpty(vote.vote)) { label = "Update Vote";}
        })(votes);
      }
    })(relevantElections);
    //To determine open, see if empty dars exist or if any election is non-open
    const isOpenEnabled = (!isEmpty(relevantEmptyDars) || nonOpenReleventElectionPresent);
    //To determine cancel, see if openRelevantElections is populated
    const isCancelEnabled = openRelevantElectionPresent;
    return {isCancelEnabled, userHasVote, label, isOpenEnabled};
  } catch(error) {
    throw new Error ('Error initializing chair actions');
  }
};

export default function ChairActions(props) {
  /*
    Chair -> Admin actions plus vote button, however there are permission caveats
    Analysis cannot be done across the entire collection, only on elections that pertain to the user

    Therefore, for opening and closing you need...
      Elections -> only the elections that pertain to the users' DAC

    For the Vote button
      Votes -> For the relevant elections (Open), see if the user has a vote (need this to figure out if vote is hidden)
            -> See if user's vote has been submitted (Vote|Update Vote)
  */

  //relevantDatasets is the list of datasets that the user has access to
  //needed to determine if a user can open an election on a DAR that has no elections
  //Done via API call, needs to be done on parent component to avoid making the same request (will return the same result) on each row
  const { showConfirmationModal, collection, relevantDatasets, goToVote } = props;
  const { dars } = collection;
  const collectionId = collection.darCollectionId;
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
    const init = ({ elections, dars, dacUserId, relevantDatasets }) => {
      const { relevantEmptyDars, relevantElections, relevantDatasetIds } =
        initUserData({ dars, elections, relevantDatasets });
      const { isCancelEnabled, userHasVote, label, isOpenEnabled } =
        calcComponentState({
          dacUserId,
          relevantElections,
          relevantEmptyDars,
          relevantDatasetIds,
        });
      setOpenEnabled(isOpenEnabled);
      //To determine cancel enabled, see if any election is open
      setCancelEnabled(isCancelEnabled);
      //set label based on function return, visibility determined by setVoteEnabled
      setVoteLabel(label);
      //enable vote button, viibility determined by userHasVote
      setVoteEnabled(userHasVote);
    };

    try {
      const { dars } = collection;
      const user = Storage.getCurrentUser();
      const { dacUserId } = user;
      const elections = flow(
        map((dar) => dar.elections),
        flatMap((electionMap) => Object.values(electionMap))
      )(dars);
      init({ dars, dacUserId, elections, relevantDatasets });
    } catch (error) {
      updateStateOnFail();
    }
  }, [dars, collection, relevantDatasets]);

  const openOnClick = async (collection) => {
    showConfirmationModal(collection, 'open');
  };

  const cancelOnClick = (collection) => {
    showConfirmationModal(collection, 'cancel');
  };

  const openButtonAttributes = {
    keyProp: `chair-open-${collectionId}`,
    label: 'Open',
    isRendered: openEnabled,
    onClick: () => openOnClick(collection),
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '5px 10px',
      fontSize: '1.45rem',
    },
  };

  const cancelButtonAttributes = {
    keyProp: `chair-cancel-${collectionId}`,
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block,
  };

  const voteButtonAttributes = {
    keyProp: `chair-vote-${collectionId}`,
    label: voteLabel,
    isRendered: voteEnabled,
    onClick: () => goToVote(collectionId),
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '5px 10px',
      fontSize: '1.45rem',
    }
  };

  return div(
    {
      className: 'chair-actions',
      key: `chair-actions-${collectionId}`,
      id: `chair-actions-${collectionId}`,
      style: {
        display: 'flex',
        padding: '10px 5px',
        justifyContent: 'space-around',
        alignItems: 'end',
      },
    },
    [
      h(SimpleButton, openButtonAttributes),
      h(SimpleButton, voteButtonAttributes),
      h(TableIconButton, cancelButtonAttributes),
    ]
  );
}
