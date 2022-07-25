import { useState, useEffect } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Styles } from '../../libs/theme';
import { Block } from '@material-ui/icons';
import { isEmpty, filter, find, map, flow, includes, intersection, toLower, forEach, flatten, flatMap, uniq, isNil } from 'lodash/fp';
import { Storage } from '../../libs/storage';
import SimpleButton from '../SimpleButton';

const duosBlue = '#0948B7';
const cancelGray = '#333F52';

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign(
  {},
  Styles.TABLE.TABLE_ICON_BUTTON,
  {color: cancelGray},
  { alignItems: 'center' }
);

const initUserData = ({dars, elections, relevantDatasets}) => {
  try {
    const relevantDatasetIds = flow(
      flatten,
      map(dataset => dataset.dataSetId),
      uniq
    )(relevantDatasets);
    const relevantDarsNoElections = filter(dar => {
      // Dataset IDs should be on the DAR, but if not, pull from the dar.data
      const datasetIds = isNil(dar.datasetIds) ? dar.data.datasetIds : dar.datasetIds;
      const relevant = flow(
        map(id => { return includes(id, relevantDatasetIds) ? isEmpty(dar.elections) : false; }),
        find((r) => { return true === r; } )
      )(datasetIds);
      return !isNil(relevant);
    })(dars);
    const relevantElections = filter((election) => {
      // NOTE: not all elections have the dataSetId attribute tied to it (https://broadworkbench.atlassian.net/browse/DUOS-1689)
      // For this ticket I'm going to use dar.datasetIds/dar.data.datasetIds as a fallback value
      if(!isNil(election.dataSetId)) {
        return includes(election.dataSetId, relevantDatasetIds);
      } else {
        // Dataset IDs should be on the DAR, but if not, pull from the dar.data
        const datasetIds = isNil(dars[election.referenceId].datasetIds) ? dars[election.referenceId].data.datasetIds : dars[election.referenceId].datasetIds;
        return intersection(datasetIds, relevantDatasetIds).length > 0;
      }
    })(elections);
    return {relevantDarsNoElections, relevantElections, relevantDatasetIds};
  } catch(error) {
    //if there's an issue with the collection it's best to fail safely, so hide all of the buttons
    throw new Error('Error initializing component data');
  }
};

const calcComponentState = ({relevantElections}) => {
  try{
    let label = 'Vote';

    //iterate through elections, push open and non-open elections into their respective arrays
    //also for each election, see if user has a vote and whether or not they've already voted
    forEach(election => {
      const {votes} = election;
      forEach(vote => {
        if(!isNil(vote.vote)) { label = 'Update'; }
      })(votes);
    })(relevantElections);
    return {label};
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
  const [openEnabled, setOpenEnabled] = useState(props.openEnabled);
  const [cancelEnabled, setCancelEnabled] = useState(props.cancelEnabled);
  const [voteEnabled, setVoteEnabled] = useState(props.voteEnabled);
  const [voteLabel, setVoteLabel] = useState('Vote');

  //if there's something wrong with the collection it's best to fail gracefully
  //use this function to hide buttons on processing err
  const updateStateOnFail = () => {
    setOpenEnabled(false);
    setCancelEnabled(false);
    setVoteEnabled(false);
    setVoteLabel(false);
  };

  useEffect(() => {
    const init = ({ elections, dars, userId, relevantDatasets }) => {
      const { relevantDarsNoElections, relevantElections } =
        initUserData({
          dars,
          elections,
          relevantDatasets
        });
      const { label } = calcComponentState({
        userId,
        relevantElections,
        relevantDarsNoElections,
        setVoteLabel
      });
      //set label based on function return, visibility determined by setVoteEnabled
      setVoteLabel(label);
    };

    try {
      const { dars } = collection;
      const user = Storage.getCurrentUser();
      const { userId } = user;
      const elections = flow(
        map((dar) => dar.elections),
        flatMap((electionMap) => Object.values(electionMap)),
        filter((election) => toLower(election.electionType) === 'dataaccess')
      )(dars);
      init({ dars, userId, elections, relevantDatasets });
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
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white'
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: 'white',
      marginRight: '8%'
    }
  };

  const cancelButtonAttributes = {
    keyProp: `chair-cancel-${collectionId}`,
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    dataTip: 'Cancel Elections',
    icon: Block,
  };

  const voteButtonAttributes = {
    keyProp: `chair-vote-${collectionId}`,
    label: voteLabel,
    isRendered: voteEnabled,
    onClick: () => goToVote(collectionId),
    baseColor: toLower(voteLabel) === 'update' ? 'white' : duosBlue,
    hoverStyle: {
      backgroundColor: toLower(voteLabel) === 'update' ? 'white' : duosBlue,
      color: toLower(voteLabel) === 'update' ? duosBlue : 'white',
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: toLower(voteLabel) === 'update' ? duosBlue : 'white',
      marginRight: '8%',
      border: `1px ${duosBlue} solid`,
    },
  };

  return div(
    {
      className: 'chair-actions',
      key: `chair-actions-${collectionId}`,
      id: `chair-actions-${collectionId}`,
      style: {
        display: 'flex',
        padding: '10px 5px',
        justifyContent: 'flex-start',
        alignItems: 'center',
      },
    },
    [
      h(SimpleButton, openButtonAttributes),
      h(SimpleButton, voteButtonAttributes),
      h(TableIconButton, cancelButtonAttributes),
    ]
  );
}
