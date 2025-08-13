import React, { useCallback, useEffect, useState } from 'react'
import { votingColors } from 'src/libs/VotingColors'
import { AsyncActionButton } from 'src/components/AsyncActionButton'

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
  /** The text label to display on the button */
  readonly label: string
  /** Whether the button is disabled */
  readonly disabled?: boolean
  /** Whether the button is in selected state */
  readonly isSelected?: boolean
  /** The base color for button styling when selected */
  readonly baseColor?: string
  /** Data attribute for Cypress testing */
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
  const [additionalStyle, setAdditionalStyle] = useState<React.CSSProperties>({})

  const defaultButtonStyle = useCallback(() => {
    updateStyle(votingColors.default, styles.defaultLabelColor, false, disabled)
  }, [disabled])

  const selectedButtonStyle = useCallback(() => {
    updateStyle(baseColor, votingColors.default, true, disabled)
  }, [baseColor, disabled])

  useEffect(() =>
    isSelected ? selectedButtonStyle() : defaultButtonStyle(),
  [defaultButtonStyle, isSelected, selectedButtonStyle])

  const updateStyle = (
    backgroundColor: string,
    labelColor: string,
    showSelectedStyle: boolean,
    disabled: boolean,
  ) => {
    setAdditionalStyle({
      backgroundColor,
      color: labelColor,
      border: showSelectedStyle ? '0px' : '1px solid',
      cursor: (showSelectedStyle && !disabled) ? 'pointer' : 'default',
    })
  }

  const handleAsyncClick = useCallback(async () => {
    if (!disabled && onClick) {
      await onClick()
    }
  }, [disabled, onClick])

  return (
    <AsyncActionButton
      data-cy={datacy}
      style={{ ...styles.baseStyle, ...additionalStyle }}
      onClick={handleAsyncClick}
      disabled={disabled}
      onError={onError}
      onMouseEnter={() => selectedButtonStyle()}
      onMouseLeave={() => !isSelected && defaultButtonStyle()}
      hideOnSuccess={false}
    >
      {label}
    </AsyncActionButton>
  )
}
