import { h, div } from "react-hyperscript-helpers";
import { useEffect, useState } from 'react';
import { lowerCase, isEmpty, flow, flatMap, map, filter } from "lodash/fp";
import { Storage } from "../../libs/storage";
import TableTextButton from '../TableTextButton';
import { Styles, Theme } from '../../libs/theme';

const hoverTextButtonStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER;
const baseTextButtonStyle = Object.assign({}, Styles.TABLE.TABLE_TEXT_BUTTON, {
  fontFamily: 'Montserrant',
  margin: '0%',
  padding: '5x 10px'
});

const findRelevantVotes = ({dars = {}, userId}) => {
  const relevantVotes = flow(
    map(dar => dar.elections),
    flatMap(electionMap => Object.values(electionMap)),
    filter(election => lowerCase(election.status) === 'open'),
    flatMap(election => Object.values(election.votes)),
    filter(vote => vote.dacUserId === userId),
  )(dars);
  return relevantVotes;
};

const determineButtonLabel = ({relevantVotes}) => {
  const submittedVotePresent = flow(
    filter(vote => !isEmpty(vote.vote)),
    isEmpty
  )(relevantVotes);
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
  const { collection } = props;
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
        setVoteEnabled(true);
        setLabel(buttonLabel);
      } else {
        setVoteEnabled(false);
      }
    } catch(error) {
      setVoteEnabled(false);
    }
  }, [collection]);

  const goToVote = (collectionId) => {
    history.push(`/dar_collection/${collectionId}`);
  };

  const voteButtonAttributes = {
    keyProp: `member-vote-${collectionId}`,
    label: label,
    isRendered: voteEnabled,
    onClick: () => goToVote(collectionId),
    style: baseTextButtonStyle,
    hoverStyle: hoverTextButtonStyle
  };

  return div({
    className: 'member-actions',
    key: `member-actions-${collectionId}`,
    style: {
      display: 'flex',
      padding: '10px 5px',
      justifyContent: 'space-around',
      alignItems: 'end'
    }
  }, [
    h(TableTextButton, voteButtonAttributes)
  ]);
}
