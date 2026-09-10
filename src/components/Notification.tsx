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

/** The banner feed speaks Bootstrap's vocabulary; MUI names one severity differently. */
const SEVERITY: Record<NonNullable<NotificationData['level']>, AlertColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

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
      severity={SEVERITY[notificationData.level ?? 'info']}
      onClose={onDismiss}
      closeText="Dismiss notification"
      sx={BANNER_SX}
    >
      <ReactMarkdown>{notificationData.message}</ReactMarkdown>
    </Alert>
  )
}
