import React, { useCallback, useState } from 'react'
import { votingColors } from 'src/libs/VotingColors'
import { AsyncSpinnerButton } from 'src/components/AsyncSpinnerButton'

const styles = {
  baseStyle: {
    height: '45px',
    width: '94px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    marginTop: '15px',
  },
  defaultLabelColor: '#333F52',
} as const

interface CollectionVoteButtonProps {
  /** Function to execute when button is clicked */
  readonly onClick?: () => Promise<void>
  /** The label to display on the button */
  readonly label: React.ReactNode
  /** Whether the button is disabled */
  readonly disabled?: boolean
  /** Whether the button is in selected state */
  readonly isSelected?: boolean
  /** The base color for button styling when selected */
  readonly baseColor?: string
  /** Data attribute for test selectors */
  readonly datacy?: string
  /** Error handler function called when onClick fails */
  readonly onError?: (error: unknown) => void
}

export default function CollectionVoteButton({
  onClick,
  label,
  disabled = false,
  isSelected = false,
  baseColor = votingColors.default,
  datacy,
  onError,
}: CollectionVoteButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const showSelectedStyle = isSelected || isHovered
  const additionalStyle: React.CSSProperties = {
    backgroundColor: showSelectedStyle ? baseColor : votingColors.default,
    color: showSelectedStyle ? votingColors.default : styles.defaultLabelColor,
    border: showSelectedStyle ? '0px' : '1px solid',
    cursor: (showSelectedStyle && !disabled) ? 'pointer' : 'default',
  }

  const handleAsyncClick = useCallback(async () => {
    if (!disabled && onClick) {
      await onClick()
    }
  }, [disabled, onClick])

  return (
    <AsyncSpinnerButton
      data-cy={datacy}
      style={{ ...styles.baseStyle, ...additionalStyle }}
      onClick={handleAsyncClick}
      disabled={disabled}
      onError={onError}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      hideOnSuccess={false}
    >
      {label}
    </AsyncSpinnerButton>
  )
}
