import React from 'react'
import PropTypes from 'prop-types'
import VotesPieChart from 'src/components/common/VotesPieChart'

const styles = {
  chairVoteInfo: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    borderRadius: '0 8px 8px 8px',
    border: '#84a3db 2px solid',
    padding: '20px',
  },
}

export const ChairVoteInfo = ({ dacVotes, isChair, adminPage = false }) => {
  return (isChair && dacVotes.length > 0) && (
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
