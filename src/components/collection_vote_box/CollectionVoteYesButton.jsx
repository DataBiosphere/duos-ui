import React from 'react'
import { votingColors } from 'src/libs/VotingColors.ts'
import CollectionVoteButton from './CollectionVoteButton'
import { CheckCircleOutlined } from '@mui/icons-material'

const styles = {
  label: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '28px',
    margin: '2.5%',
  },
}

const Label = () => {
  return (
    <span style={styles.label}>
      <CheckCircleOutlined style={styles.icon} />
      Yes
    </span>
  )
}

export default function CollectionVoteYesButton(props) {
  const { onClick, disabled, isSelected, onError } = props

  return (
    <CollectionVoteButton
      datacy="yes-collection-vote-button"
      label={<Label />}
      onClick={onClick}
      baseColor={votingColors.yes}
      disabled={disabled}
      isSelected={isSelected}
      onError={onError}
    />
  )
}
