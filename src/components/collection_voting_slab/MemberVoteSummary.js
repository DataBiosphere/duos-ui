import {useState} from 'react';
import {div, h} from 'react-hyperscript-helpers';
import {
  collapseVotesByUser,
} from '../../utils/DarCollectionUtils';
import VoteSummaryTable from '../vote_summary_table/VoteSummaryTable';
import { ArrowDropUp, ArrowDropDown } from '@material-ui/icons';

import './member_vote_summary.css';

export const MemberVoteSummary = (props) => {
  const {
    isLoading = false,
    title = 'DAC Member Votes (detail)',
    adminPage = false,
    dacVotes
  } = props;

  const [showMemberVotes, setShowMemberVotes] = useState(false);

  return div({}, [
    div({
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '10px',
      }
    }, [
      title,
      h((showMemberVotes? ArrowDropUp : ArrowDropDown), {
        id: "show-member-vote-dropdown",
        className: `sort-icon dac-member-vote-dropdown-arrow ${showMemberVotes ? 'sort-icon-up' : 'sort-icon-down'}`,
        onClick: () => {
          setShowMemberVotes(!showMemberVotes);
        },
      }),
    ]),
    h(VoteSummaryTable, {
      dacVotes: collapseVotesByUser(dacVotes),
      isRendered: showMemberVotes,
      isLoading,
      adminPage
    }),
  ]);
};

export default MemberVoteSummary;