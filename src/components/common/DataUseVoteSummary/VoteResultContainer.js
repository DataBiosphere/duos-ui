import VoteResultIcon from './VoteResultIcon';
import VoteResultLabel from './VoteResultLabel';
import { isEmpty, filter, isNil } from 'lodash/fp';
import { h, div } from 'react-hyperscript-helpers';

//helper function to generate keys for rendered elements
const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};

const determineUnanimousVoteResult = ({votes = []}) => {
  const filteredVotes = filter((vote) => !isNil(vote.vote))(votes);
  if (isEmpty(filteredVotes)) {
    return 'underReview';
  }
  const voteCount = filteredVotes.length;

  let voteTally = {
    true: 0,
    false: 0,
  };

  filteredVotes.forEach((vote = {}) => {
    voteTally[vote.vote] += 1;
  });

  if (voteTally.true === voteCount) {
    return true;
  } else if (voteTally.false === voteCount) {
    return false;
  } else if (voteTally.true + voteTally.false === voteCount) {
    return 'mixed';
  } else {
    return 'underReview';
  }
};

export default function VoteResultContainer({
  finalVotes = [],
  label,
  additionalLabelStyle = {},
}) {
  const baseContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    width: '10%',
  };
  const hyphenatedKey = convertLabelToKey(label);

  const result = determineUnanimousVoteResult({votes: finalVotes});
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
