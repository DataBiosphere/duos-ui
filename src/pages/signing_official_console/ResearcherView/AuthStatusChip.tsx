import React from 'react'
import { Chip } from '@mui/material'
import { AuthStatus } from './types'

interface StatusConfig {
  label: string
  color: string
  bgcolor: string
}

const STATUS_CONFIG: Record<AuthStatus, StatusConfig> = {
  authorized: { label: 'Authorized', color: '#155724', bgcolor: '#d4edda' },
  not_requested: { label: 'Not Requested', color: '#6c757d', bgcolor: '#f8f9fa' },
  revoked: { label: 'Revoked', color: '#721c24', bgcolor: '#f8d7da' },
}

interface AuthStatusChipProps {
  readonly status: AuthStatus
}

export default function AuthStatusChip({ status }: AuthStatusChipProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_requested
  return (
    <Chip
      data-cy={`auth-status-chip-${status}`}
      label={cfg.label}
      sx={{
        bgcolor: cfg.bgcolor,
        color: cfg.color,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        fontSize: 11,
        height: 24,
        fontFamily: 'Montserrat',
      }}
    />
  )
}
