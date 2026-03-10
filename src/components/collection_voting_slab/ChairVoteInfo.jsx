import React from 'react'
import PropTypes from 'prop-types'
import { isNil } from 'lodash'
import VotesPieChart from 'src/components/common/VotesPieChart'

const styles = {
  chairVoteInfo: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '1.5rem',
    fontWeight: 'bold',
  },
}

export const ChairVoteInfo = ({ dacVotes, isChair, adminPage = false }) => {
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
          styleOverride={{}}
        />
      </div>
    </div>
  )
}

ChairVoteInfo.propTypes = {
  dacVotes: PropTypes.array.isRequired,
  isChair: PropTypes.bool,
  adminPage: PropTypes.bool,
}
