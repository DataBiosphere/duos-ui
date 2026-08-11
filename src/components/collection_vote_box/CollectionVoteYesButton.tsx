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
    fontSize: '20px',
    marginRight: '0.4rem',
  },
} as const

const Label = ({ roleLabel }: Readonly<{ roleLabel?: string }>) => {
  return (
    <span style={styles.label}>
      <CheckCircleOutlined style={styles.icon} />
      {roleLabel ? `Yes as ${roleLabel}` : 'Yes'}
    </span>
  )
}

interface CollectionVoteYesButtonProps {
  readonly onClick?: () => Promise<void>
  readonly disabled?: boolean
  readonly isSelected?: boolean
  readonly onError?: (error: unknown) => void
  readonly roleLabel?: string
}

export default function CollectionVoteYesButton({ onClick, disabled, isSelected, onError, roleLabel }: CollectionVoteYesButtonProps) {
  return (
    <CollectionVoteButton
      datacy="yes-collection-vote-button"
      label={<Label roleLabel={roleLabel} />}
      onClick={onClick}
      baseColor={votingColors.yes}
      disabled={disabled}
      isSelected={isSelected}
      onError={onError}
    />
  )
}
