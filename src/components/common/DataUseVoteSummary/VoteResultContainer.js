import VoteResultIcon from './VoteResultIcon';
import VoteResultLabel from './VoteResultLabel';
import { isEmpty } from 'lodash/fp';
import { h, div } from 'react-hyperscript-helpers';

const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};

const determineUnanimousVoteResult = ({votes = [], isRP = false}) => {
  const voteCount = votes.length;
  if (isEmpty(votes) || voteCount < 1) {
    return 'underReview';
  }
  let voteTally = {
    true: 0,
    false: 0,
  };

  votes.forEach((vote = {}) => {
    voteTally[vote.vote] += 1;
  });

  if (voteTally.true === voteCount) {
    return true;
  } else if (voteTally.false === voteCount) {
    return false;
  } else if (voteTally.true + voteTally.false === voteCount) {
    return isRP ? 'legacy' : 'mixed';
  } else {
    return 'underReview';
  }
};

export default function VoteResultContainer({
  finalVotes = [],
  label,
  additionalLabelStyle = {},
  isRP = false,
}) {
  const baseContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    width: '10%',
  };
  const hyphenatedKey = convertLabelToKey(label);
  //QUESTION: How will RP votes work from here on out
  //Currently there is an RP election for each DAR (so by extension one for each dataset)
  //Therefore there are technically X amount of RP elections, all of which are decided independenly for each other
  //With the multi-dataset vote feature, will there only be one RP election across the election?
  //Or will it be the same as before except now we just update all of the RP elections at once on vote submission?

  const result = determineUnanimousVoteResult({votes: finalVotes, isRP});
  return div(
    {
      style: baseContainerStyle,
      key: hyphenatedKey,
      className: 'vote-summary-container',
    },
    [
      h(VoteResultLabel, {
        propKey: hyphenatedKey,
        label,
        additionalLabelStyle,
      }),
      h(VoteResultIcon, { result, propKey: hyphenatedKey }),
    ]
  );
}
