import React from 'react'
import { votingColors } from 'src/libs/VotingColors'
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
} as const

const Label = () => {
  return (
    <span style={styles.label}>
      <CheckCircleOutlined style={styles.icon} />
      Yes
    </span>
  )
}

interface CollectionVoteYesButtonProps {
  readonly onClick?: () => Promise<void>
  readonly disabled?: boolean
  readonly isSelected?: boolean
  readonly onError?: (error: unknown) => void
}

export default function CollectionVoteYesButton({ onClick, disabled, isSelected, onError }: CollectionVoteYesButtonProps) {
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
