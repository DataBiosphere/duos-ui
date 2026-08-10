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
    fontSize: '20px',
    marginRight: '0.4rem',
  },
} as const

const Label = ({ roleLabel }: Readonly<{ roleLabel?: string }>) => {
  return (
    <span style={styles.label}>
      <CancelOutlined style={styles.icon} />
      {roleLabel ? `No as ${roleLabel}` : 'No'}
    </span>
  )
}

interface CollectionVoteNoButtonProps {
  readonly onClick?: () => Promise<void>
  readonly disabled?: boolean
  readonly isSelected?: boolean
  readonly onError?: (error: unknown) => void
  readonly roleLabel?: string
}

export default function CollectionVoteNoButton({ onClick, disabled, isSelected, onError, roleLabel }: CollectionVoteNoButtonProps) {
  return (
    <CollectionVoteButton
      datacy="no-collection-vote-button"
      label={<Label roleLabel={roleLabel} />}
      onClick={onClick}
      baseColor={votingColors.no}
      disabled={disabled}
      isSelected={isSelected}
      onError={onError}
    />
  )
}
