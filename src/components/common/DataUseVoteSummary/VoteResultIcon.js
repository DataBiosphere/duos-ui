import {CheckCircle, Cancel, Autorenew, RemoveCircle} from '@material-ui/icons';
import {h, div} from 'react-hyperscript-helpers';
import {filter, isEmpty, isNil} from "lodash/fp";

const iconFontStyle = {
  fontSize: '3.5rem',
  flex: 1,
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

//Possible icons should be Yes, No, Mixed, and Under Review
export default function VoteResultIcon({propKey, votes}) {
  const templates = {
    true: [
      h(CheckCircle, {
        className: `vote-result-yes-icon-${propKey}`,
        style: Object.assign({color: '#1FA371'}, iconFontStyle),
      })
    ],
    false: [
      h(Cancel, {
        className: `vote-result-no-icon-${propKey}`,
        style: Object.assign({color: '#DA0003'}, iconFontStyle),
      })
    ],
    underReview: [
      h(Autorenew, {
        className: `vote-result-under-review-icon-${propKey}`,
        style: Object.assign({color: '#A3ADBF'}, iconFontStyle),
      })
    ],
    mixed: [
      h(RemoveCircle, {
        className: `vote-result-mixed-icon-${propKey}`,
        style: Object.assign({color: '#A3ADBF'}, iconFontStyle),
        'data-tip':
          'Mixed outcome stems from varying election results within this Data Use categorization.',
      })
    ]
  };

  const result = determineUnanimousVoteResult({votes});
  return div(
    {
      key: `vote-result-icon-${propKey}`,
      className: `vote-result-icon-${propKey}`,
      style: {display: 'flex'}
    },
    templates[result]
  );
}