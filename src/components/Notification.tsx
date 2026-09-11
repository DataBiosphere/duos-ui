import React from 'react'
import Alert, { AlertColor } from '@mui/material/Alert'
import ReactMarkdown from 'react-markdown'

export interface NotificationData {
  message: string
  level?: 'info' | 'warning' | 'danger' | 'success'
}

interface NotificationProps {
  notificationData?: NotificationData | null
  onDismiss?: () => void
}

// The feed is ops-authored JSON, so an unknown level reaches here untyped and falls back to info.
const SEVERITY: Record<NonNullable<NotificationData['level']>, AlertColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

// An own-property check, so a level like "toString" cannot reach MUI as an inherited value.
const severityFor = (level: NotificationData['level']): AlertColor =>
  level !== undefined && Object.hasOwn(SEVERITY, level) ? SEVERITY[level] : 'info'

const BANNER_SX = {
  'alignItems': 'center',
  // Beats the global `a, input { text-decoration: none !important }` in index.css.
  '& a': { textDecoration: 'underline !important' },
  '& p:first-of-type': { marginTop: 0 },
  '& p:last-of-type': { marginBottom: 0 },
}

export const Notification = ({ notificationData, onDismiss }: Readonly<NotificationProps>) => {
  if (!notificationData?.message) {
    return null
  }

  return (
    <Alert
      severity={severityFor(notificationData.level)}
      onClose={onDismiss}
      closeText="Dismiss notification"
      sx={BANNER_SX}
    >
      <ReactMarkdown>{notificationData.message}</ReactMarkdown>
    </Alert>
  )
}
