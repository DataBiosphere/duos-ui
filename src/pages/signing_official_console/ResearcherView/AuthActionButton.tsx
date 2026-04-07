import React from 'react'
import { Button } from '@mui/material'
import { AuthStatus } from './types'

const BRAND_BLUE = '#0948b7'
const FONT = 'Montserrat'

interface AuthActionButtonProps {
  readonly status: AuthStatus
  readonly onAuthorize: () => void
  readonly onRevoke: () => void
  readonly disabled?: boolean
}

/**
 * Renders the appropriate action button based on the researcher's current
 * authorization status for a given DAA.
 *
 * - not_requested        → "Authorize" (primary filled)
 * - authorized           → "Revoke"    (outlined red)
 * - revoked              → "Re-authorize" (outlined blue)
 */
export default function AuthActionButton({
  status,
  onAuthorize,
  onRevoke,
  disabled = false,
}: AuthActionButtonProps) {
  if (status === 'authorized') {
    return (
      <Button
        variant="outlined"
        size="small"
        data-cy="auth-action-revoke"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onRevoke()
        }}
        sx={{
          borderColor: '#dc3545',
          color: '#dc3545',
          borderWidth: 1.5,
          fontFamily: FONT,
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: 11,
        }}
      >
        Revoke
      </Button>
    )
  }

  if (status === 'revoked') {
    return (
      <Button
        variant="outlined"
        size="small"
        data-cy="auth-action-reauthorize"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onAuthorize()
        }}
        sx={{
          borderColor: BRAND_BLUE,
          color: BRAND_BLUE,
          borderWidth: 1.5,
          fontFamily: FONT,
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: 11,
        }}
      >
        Re-authorize
      </Button>
    )
  }

  // not_requested
  return (
    <Button
      variant="contained"
      size="small"
      data-cy="auth-action-authorize"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onAuthorize()
      }}
      sx={{
        'bgcolor': BRAND_BLUE,
        'fontFamily': FONT,
        'fontWeight': 700,
        'textTransform': 'uppercase',
        'fontSize': 11,
        '&:hover': { bgcolor: '#073a94' },
      }}
    >
      Authorize
    </Button>
  )
}
