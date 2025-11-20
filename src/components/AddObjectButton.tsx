import React from 'react'
import AddIcon from '@mui/icons-material/Add'

interface StudyAssetAddButtonProps {
  readonly id: string
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly hasValidationError?: boolean
  readonly icon?: React.ReactNode
  readonly className?: string
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
  } = props

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
      {icon}
      <span style={{ marginLeft: '0.5rem' }}>{label}</span>
    </button>
  )
}
