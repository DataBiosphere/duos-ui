import React, { useState, useCallback } from 'react'
import { Spinner } from 'src/components/Spinner'

export interface AsyncActionButtonProps {
  /** The text to display on the button */
  'children': React.ReactNode
  /** Function to execute when button is clicked - should return a Promise */
  'onClick': () => Promise<void>
  /** Optional custom styling for the button */
  'style'?: React.CSSProperties
  /** Optional CSS class name for the button */
  'className'?: string
  /** Optional aria-label for accessibility - defaults to button text */
  'aria-label'?: string
  /** Optional data-cy attribute for Cypress testing */
  'data-cy'?: string
  /** Optional disabled state */
  'disabled'?: boolean
  /** Optional ID for the button */
  'id'?: string
  /** Optional error handler function called when onClick fails */
  'onError'?: (error: unknown) => void
}

export const AsyncActionButton: React.FC<AsyncActionButtonProps> = ({
  children,
  onClick,
  style,
  className,
  'aria-label': ariaLabel,
  'data-cy': dataCy,
  disabled = false,
  id,
  onError,
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

  // Don't render if the action was successful
  if (isSuccess) {
    return null
  }

  const defaultStyle: React.CSSProperties = {
    border: '1px solid #0060A0',
    borderRadius: '4px',
    backgroundColor: '#0060A0',
    color: 'white',
    padding: '8px 16px',
    fontSize: '16px',
    cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '120px',
    textTransform: 'uppercase',
    fontFamily: 'inherit',
    opacity: (isLoading || disabled) ? 0.6 : 1,
    transition: 'opacity 0.2s ease-in-out',
    ...style,
  }

  const buttonText = typeof children === 'string' ? children : 'Button'
  const effectiveAriaLabel = ariaLabel || buttonText
  const effectiveDataCy = dataCy || `async-action-button-${buttonText.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || disabled}
      style={defaultStyle}
      className={className}
      aria-label={effectiveAriaLabel}
      aria-busy={isLoading}
      role="button"
      data-cy={effectiveDataCy}
      id={id}
    >
      {isLoading
        ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: 'scale(0.6)', transformOrigin: 'center' }}>
                <Spinner />
              </div>
            </div>
          )
        : (
            children
          )}
    </button>
  )
}

export default AsyncActionButton
