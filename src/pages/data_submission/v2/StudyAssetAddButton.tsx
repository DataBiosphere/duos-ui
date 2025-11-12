import React from 'react'
import AddIcon from '@mui/icons-material/Add'

interface StudyAssetAddButtonProps {
  readonly id: string
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly hasValidationError?: boolean
}

export default function StudyAssetAddButton(props: StudyAssetAddButtonProps): React.JSX.Element {
  const { id, label, onClick, disabled = false, hasValidationError = false } = props

  return (
    <button
      id={id}
      type="button"
      className="button button-white"
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
      <AddIcon fontSize="medium" />
      {label}
    </button>
  )
}
