import React from 'react'
import '@testing-library/jest-dom/vitest'
import AddIcon from '@mui/icons-material/Add'
import 'src/components/forms/formTheme.css'

interface StudyAssetAddButtonProps {
  readonly id: string
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly hasValidationError?: boolean
  readonly icon?: React.ReactNode
  readonly className?: string
  /**
   * 'inline' is the in-form "add another row" style (Add PI, Add File/Storage Profile): outlined,
   * rounded, standard 8px/16px padding, styled by formTheme.css rather than inline styles.
   */
  readonly variant?: 'default' | 'inline'
}

export default function AddObjectButton(props: StudyAssetAddButtonProps): React.JSX.Element {
  const {
    id,
    label,
    onClick,
    disabled = false,
    hasValidationError = false,
    icon = <AddIcon fontSize="medium" />,
    className = 'button button-white',
    variant = 'default',
  } = props

  if (variant === 'inline') {
    return (
      <button
        id={id}
        type="button"
        className={`add-row-button ${hasValidationError ? 'errored' : ''}`}
        onClick={() => !disabled && onClick()}
        disabled={disabled}
      >
        <span className="add-row-button-icon" aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      id={id}
      type="button"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 5,
        border: hasValidationError ? '1px solid red' : '1px solid #0948B7',
        boxShadow: hasValidationError ? '0 0 5px red' : 'none',
        ...(disabled ? { cursor: 'not-allowed' } : {}),
      }}
      onClick={() => !disabled && onClick()}
      disabled={disabled}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        <span>{label}</span>
      </span>
    </button>
  )
}
