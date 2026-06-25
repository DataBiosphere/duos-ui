import React, { useState } from 'react'
import { collapseVotesByUser } from 'src/utils/DarCollectionUtils'
import VoteSummaryTable from 'src/components/vote_summary_table/VoteSummaryTable'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Vote } from 'src/types/model'

interface MemberVoteSummaryProps {
  readonly dacVotes: Vote[]
  readonly isLoading?: boolean
  readonly title?: string
  readonly adminPage?: boolean
  readonly isChair?: boolean
}

export const MemberVoteSummary = ({
  isLoading = false,
  title = 'DAC Member Votes (detail)',
  adminPage = false,
  isChair = false,
  dacVotes,
}: MemberVoteSummaryProps) => {
  const [showMemberVotes, setShowMemberVotes] = useState(false)

  return (
    <div style={{
      marginBottom: '10px',
      borderRadius: '8px 8px 8px 8px',
      border: '#84a3db 2px solid',
      padding: '20px 20px 20px 20px',
    }}
    >
      <button
        type="button"
        className={`sort-icon ${showMemberVotes ? 'sort-icon-up' : 'sort-icon-down'}`}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
        onClick={() => setShowMemberVotes(!showMemberVotes)}
        id="show-member-vote-dropdown"
        aria-expanded={showMemberVotes}
      >
        <span style={{ display: 'flex' }}>{showMemberVotes ? <ExpandLess /> : <ExpandMore />}</span>
        <span>{title}</span>
      </button>
      {showMemberVotes && (
        <VoteSummaryTable
          dacVotes={collapseVotesByUser(dacVotes)}
          isLoading={isLoading}
          adminPage={adminPage}
          isChair={isChair}
        />
      )}
    </div>
  )
}
export default MemberVoteSummary
