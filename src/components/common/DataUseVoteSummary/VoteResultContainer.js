import VoteResultLabel from './VoteResultLabel';
import { h, div } from 'react-hyperscript-helpers';


export default function VoteResultContainer({
  finalVotes = [],
  label,
  additionalLabelStyle = {},
}) {

  return div(
    {
      style: { width: '10%'},
      className: 'vote-summary-container',
    },
    [
      h(VoteResultLabel, {
        label,
        additionalLabelStyle,
        finalVotes
      })
    ]
  );
}
