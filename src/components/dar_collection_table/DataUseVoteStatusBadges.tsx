import React from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import { isNil } from 'src/utils/NodashUtil'

// Deliberately narrower than the full `Vote` type: `collapseVotesByUser` returns collapsed
// vote summaries (userId/vote/displayName), not full Vote objects, and that's all this
// component needs to render.
export interface MemberVoteLike {
  userId: number
  vote?: boolean
  displayName: string
}

export interface DataUseVoteStatusBadgesProps {
  memberVotes: MemberVoteLike[]
}

/**
 * Number-only Approve/Deny/Pending count pills for a data-use group's DAC member votes,
 * with the voting members' names on hover. `memberVotes` is expected to already be
 * DAC-filtered and collapsed to one Vote per member. A category with zero members is
 * omitted entirely, to keep rows compact and single-line.
 */
export const DataUseVoteStatusBadges: React.FC<DataUseVoteStatusBadgesProps> = ({ memberVotes }) => {
  const approved = memberVotes.filter(v => v.vote === true)
  const denied = memberVotes.filter(v => v.vote === false)
  const pending = memberVotes.filter(v => isNil(v.vote))

  if (approved.length === 0 && denied.length === 0 && pending.length === 0) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
      {approved.length > 0 && (
        <Tooltip title={`Approve: ${approved.map(v => v.displayName).join(', ')}`}>
          <Chip size="small" color="success" label={approved.length} />
        </Tooltip>
      )}
      {denied.length > 0 && (
        <Tooltip title={`Deny: ${denied.map(v => v.displayName).join(', ')}`}>
          <Chip size="small" color="error" label={denied.length} />
        </Tooltip>
      )}
      {pending.length > 0 && (
        <Tooltip title={`Pending: ${pending.map(v => v.displayName).join(', ')}`}>
          <Chip size="small" label={pending.length} />
        </Tooltip>
      )}
    </Box>
  )
}

export default DataUseVoteStatusBadges
