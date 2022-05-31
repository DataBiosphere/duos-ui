import { h, div } from 'react-hyperscript-helpers';
import { useEffect, useState } from 'react';
import { toLower, isEmpty, flow, flatMap, map, filter, toUpper, any, isNil } from 'lodash/fp';
import { Storage } from '../../libs/storage';
import SimpleButton from '../SimpleButton';

const duosBlue = '#0948B7';

const findRelevantVotes = ({ dars = {}, userId}) => {
  const relevantVotes = flow(
    map((dar) => dar.elections),
    flatMap((electionMap) => Object.values(electionMap)),
    filter((election) => toLower(election.status) === 'open' && !isEmpty(election.votes)),
    flatMap((election) => Object.values(election.votes)),
    filter((vote) => vote.dacUserId === userId)
  )(dars);
  return relevantVotes;
};



const determineButtonLabel = ({relevantVotes}) => {
  const submittedVotePresent = any(vote => !isNil(vote.vote))(relevantVotes);
  return submittedVotePresent ? 'Update Vote' : 'Vote';
};

export default function MemberActions(props) {
  /*
    Members can only vote on collections
    Only goal is to determine whether or not the vote button appears
      //Look through votes on elections, if user has a vote present and the election is open, show button
      //Otherwise hide the button
  */

  /*
  For a collection, the component needs:
    Current User
    Elections in the collection,
    Votes attached to the collection
  */
  const { collection, goToVote } = props;
  const collectionId = collection.darCollectionId;
  const [voteEnabled, setVoteEnabled] = useState(false);
  const [label, setLabel] = useState('Vote');

  useEffect(() => {
    try {
      const { dars } = collection;
      const user = Storage.getCurrentUser();
      const userId = user.dacUserId;
      const relevantVotes = findRelevantVotes({dars, userId});
      if(!isEmpty(relevantVotes)) {
        const buttonLabel = determineButtonLabel({relevantVotes});
        setLabel(buttonLabel);
        setVoteEnabled(true);
      } else {
        setVoteEnabled(false);
      }
    } catch(error) {
      setVoteEnabled(false);
    }
  }, [collection]);

  const voteButtonAttributes = {
    keyProp: `member-vote-${collectionId}`,
    label: toUpper(label),
    isRendered: voteEnabled,
    onClick: () => goToVote(collectionId),
    baseColor: duosBlue,
    hoverColor: duosBlue,
    additionalStyle: {
      padding: '3% 10%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: 'white',
      marginRight: '30%'
    }
  };

  return div({
    className: 'member-actions',
    key: `member-actions-${collectionId}`,
    style: {
      display: 'flex',
      padding: '10px 5px',
      justifyContent: 'flex-start',
      alignItems: 'end',
      fontFamily: 'Montserrat'
    }
  }, [
    h(SimpleButton, voteButtonAttributes)
  ]);
}
