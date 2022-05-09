import VoteResultLabel from './VoteResultLabel';
import { h, div } from 'react-hyperscript-helpers';

//helper function to generate keys for rendered elements
const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};

export default function VoteResultContainer({
  finalVotes = [],
  label,
  additionalLabelStyle = {},
}) {

  const hyphenatedKey = convertLabelToKey(label);
  return div(
    {
      style: { width: '10%'},
      key: hyphenatedKey,
      className: 'vote-summary-container',
    },
    [
      h(VoteResultLabel, {
        propKey: hyphenatedKey,
        label,
        additionalLabelStyle,
        finalVotes
      })
    ]
  );
}
