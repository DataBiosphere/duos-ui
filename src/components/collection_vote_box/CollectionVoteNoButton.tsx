import React from 'react'
import { votingColors } from 'src/libs/VotingColors'
import CollectionVoteButton from './CollectionVoteButton'
import { CancelOutlined } from '@mui/icons-material'

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
      <CancelOutlined style={styles.icon} />
      No
    </span>
  )
}

interface CollectionVoteNoButtonProps {
  readonly onClick?: () => Promise<void>
  readonly disabled?: boolean
  readonly isSelected?: boolean
  readonly onError?: (error: unknown) => void
}

export default function CollectionVoteNoButton({ onClick, disabled, isSelected, onError }: CollectionVoteNoButtonProps) {
  return (
    <CollectionVoteButton
      datacy="no-collection-vote-button"
      label={<Label />}
      onClick={onClick}
      baseColor={votingColors.no}
      disabled={disabled}
      isSelected={isSelected}
      onError={onError}
    />
  )
}
