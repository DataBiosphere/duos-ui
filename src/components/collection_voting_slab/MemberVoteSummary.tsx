import React from 'react'
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
  readonly expanded: boolean
  readonly onToggle: () => void
}

export const MemberVoteSummary = ({
  isLoading = false,
  title = 'DAC Member Votes (detail)',
  adminPage = false,
  isChair = false,
  dacVotes,
  expanded,
  onToggle,
}: MemberVoteSummaryProps) => {
  return (
    <div style={{
      borderRadius: '6px',
      border: '1px solid #d0d0d0',
      padding: '0.6rem 0.9rem',
    }}
    >
      <button
        type="button"
        className={`sort-icon ${expanded ? 'sort-icon-up' : 'sort-icon-down'}`}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', fontSize: '1.3rem', fontWeight: 700 }}
        onClick={onToggle}
        id="show-member-vote-dropdown"
        aria-expanded={expanded}
      >
        <span style={{ display: 'flex' }}>{expanded ? <ExpandLess /> : <ExpandMore />}</span>
        <span>{title}</span>
      </button>
      {expanded && (
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
