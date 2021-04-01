import { h } from 'react-hyperscript-helpers';
import TableTextButton from '../TableTextButton';

export default function VoteButton(props) {
  const {election, history, darReferenceId, disabled} = props;
  return h(TableTextButton, {
    key: `vote-button-${election.referenceId}`,
    onClick: () => history.push(`access_review/${darReferenceId}`),
    label: 'Vote',
    disabled
  });
}