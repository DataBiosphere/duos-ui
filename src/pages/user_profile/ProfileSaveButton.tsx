import React from 'react'
import { Button } from '@mui/material'
import './profileControls.css'

interface ProfileSaveButtonProps {
  readonly onClick: () => void
  readonly disabled?: boolean
}

/**
 * The Save control for every User Profile section. It uses the same contained MUI button as
 * the study details 'Apply for Access' action, sized to match the profile inputs beside it.
 */
export default function ProfileSaveButton({ onClick, disabled }: ProfileSaveButtonProps) {
  return (
    <Button
      variant="contained"
      sx={{ minWidth: 72, height: 'var(--profile-control-height)', px: 2 }}
      disabled={disabled}
      onClick={onClick}
    >
      Save
    </Button>
  )
}
