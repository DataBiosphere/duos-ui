import {React, useState} from 'react';
import {
  collapseVotesByUser,
} from '../../utils/DarCollectionUtils';
import VoteSummaryTable from '../vote_summary_table/VoteSummaryTable';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

import './member_vote_summary.css';

export const MemberVoteSummary = (props) => {
  const {
    isLoading = false,
    title = 'DAC Member Votes (detail)',
    adminPage = false,
    isChair = false,
    dacVotes
  } = props;

  const [showMemberVotes, setShowMemberVotes] = useState(false);

  return(  <div style={{
    marginBottom: '10px',
    borderRadius: '8px 8px 8px 8px',
    border: '#84a3db 2px solid',
    padding: '20px 20px 20px 20px',
  }}>
    <div
      className={`sort-icon dac-member-vote-dropdown-arrow ${showMemberVotes ? 'sort-icon-up' : 'sort-icon-down'}`}
      style={{display:'flex', flexDirection:'row', alignItems:'center'}}
      onClick={ () => { setShowMemberVotes(!showMemberVotes); } }
      id={'show-member-vote-dropdown'}
    >
      <span style={{display:'flex'}}>{showMemberVotes? <ExpandLess/> : <ExpandMore/>}</span><span>{title}</span>
    </div>
    {showMemberVotes && <VoteSummaryTable
      dacVotes={collapseVotesByUser(dacVotes)}
      isLoading={isLoading}
      adminPage={adminPage}
      isChair={isChair}
    />
    }
  </div>);
};
export default MemberVoteSummary;