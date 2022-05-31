import { h } from 'react-hyperscript-helpers';
import TableTextButton from '../TableTextButton';
import { Styles } from '../../libs/theme';
import { isNil } from 'lodash/fp';

export default function VoteButton(props) {
  //targetVotes are the votes for this user and this election, defined on DarTableActions line 98
  const {targetVotes, election, history, darReferenceId, disabled, addBaseStyle} = props;
  const hasVoted = targetVotes.some((vote) => {
    return !isNil(vote.vote);
  });
  const baseStyle = hasVoted ? Styles.TABLE.TABLE_TEXT_BUTTON_OUTLINED : Styles.TABLE.TABLE_TEXT_BUTTON;

  return h(TableTextButton, {
    key: `vote-button-${election.referenceId}`,
    onClick: () => history.push(`access_review/${darReferenceId}`),
    label: hasVoted ? 'Update Vote' : 'Vote',
    disabled,
    dataTip: disabled ? 'You do not have permission to vote on this election' :
      hasVoted ? 'Update Vote on Election' : 'Vote on Election',
    style: Object.assign({}, baseStyle, addBaseStyle),
    hoverStyle: hasVoted ? Styles.TABLE.TABLE_BUTTON_TEXT_HOVER_OUTLINED : undefined
  });
}
