import React from 'react'
import { isNil } from 'src/utils/NodashUtil'
import VotesPieChart from 'src/components/common/VotesPieChart'
import { Vote } from 'src/types/model'

const styles = {
  chairVoteInfo: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '1.5rem',
    fontWeight: 'bold',
  },
} as const

interface ChairVoteInfoProps {
  readonly dacVotes: Vote[]
  readonly isChair?: boolean
  readonly adminPage?: boolean
}

export const ChairVoteInfo = ({ dacVotes, isChair, adminPage = false }: ChairVoteInfoProps) => {
  return (isChair && dacVotes.some(v => !isNil(v.vote))) && (
    <div
      style={styles.chairVoteInfo}
      data-cy="chair-vote-info"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '1% 0',
          marginTop: '10%',
        }}
      >
        <div
          style={{ fontSize: 17, color: '#333F52', fontFamily: 'Montserrat' }}
        >
          {adminPage ? 'DAC Votes (summary)' : `My DAC's Votes (summary)`}
        </div>
        <VotesPieChart
          votes={dacVotes}
          keyString="chair-dac-votes"
          styleOverride={{}}
        />
      </div>
    </div>
  )
}
