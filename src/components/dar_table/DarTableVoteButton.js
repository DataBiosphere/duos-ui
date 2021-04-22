import { h } from 'react-hyperscript-helpers';
import TableTextButton from '../TableTextButton';
import { isNil } from "lodash/fp";

export default function VoteButton(props) {
  //targetVotes are the votes for this user and this election, defined on DarTableActions line 98
  const {targetVotes, election, history, darReferenceId, disabled} = props;
  const hasVoted = targetVotes.some((vote) => {
    return !isNil(vote.vote);
  });
  return h(TableTextButton, {
    key: `vote-button-${election.referenceId}`,
    onClick: () => history.push(`access_review/${darReferenceId}`),
    label: hasVoted ? 'Update Vote' : 'Vote',
    disabled,
    dataTip: disabled ? 'You do not have permission to vote on this election' :
      hasVoted ? 'Update Vote on Election' : 'Vote on Election'
  });
}