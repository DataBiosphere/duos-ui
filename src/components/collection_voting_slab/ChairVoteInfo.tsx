import React from 'react'
import VotesPieChart from 'src/components/common/VotesPieChart'
import { Vote } from 'src/types/model'

const styles = {
  chairVoteInfo: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '0.5rem',
    fontWeight: 'bold',
  },
} as const

interface ChairVoteInfoProps {
  readonly dacVotes: Vote[]
  readonly isChair?: boolean
  readonly adminPage?: boolean
}

export const ChairVoteInfo = ({ dacVotes, isChair, adminPage = false }: ChairVoteInfoProps) => {
  return Boolean(isChair) && (
    <div
      style={styles.chairVoteInfo}
      data-cy="chair-vote-info"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '0.3rem 0',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#333F52',
            fontFamily: 'Montserrat',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
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
