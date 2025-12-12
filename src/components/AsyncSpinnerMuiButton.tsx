import React, { useState, useCallback } from 'react'
import { Button, ButtonProps, CircularProgress } from '@mui/material'

export interface AsyncSpinnerMuiButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Function to execute when button is clicked - should return a Promise */
  onClick: () => Promise<void>
  /** Optional error handler function called when onClick fails */
  onError?: (error: unknown) => void
  /** Whether to hide the button after successful completion */
  hideOnSuccess?: boolean
}

/**
 * An async button component that wraps MUI Button with loading state and spinner.
 * Displays a circular progress indicator while the async operation is in progress.
 * Inherits all MUI Button props for consistent styling.
 */
export const AsyncSpinnerMuiButton: React.FC<AsyncSpinnerMuiButtonProps> = ({
  children,
  onClick,
  onError,
  hideOnSuccess = false,
  disabled = false,
  ...buttonProps
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return
    setIsLoading(true)
    try {
      await onClick()
      setIsSuccess(true)
      setIsLoading(false)
    }
    catch (error) {
      setIsLoading(false)
      onError?.(error)
    }
  }, [onClick, isLoading, disabled, onError])

  // Don't render if the action was successful and hideOnSuccess is true
  if (isSuccess && hideOnSuccess) {
    return null
  }

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      disabled={isLoading || disabled}
    >
      {isLoading
        ? (
            <CircularProgress
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              size={24}
            />
          )
        : (
            children
          )}
    </Button>
  )
}

export default AsyncSpinnerMuiButton
