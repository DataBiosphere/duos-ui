import React from 'react'
import { Button } from '@mui/material'
import { ToastNotifications } from 'src/libs/ToastNotifications'

// Ownership prevents concurrent reports and stale dismissals from changing the guard.
let activeNotice: symbol | null = null

export const showUnconfirmedSignOutNotice = (retry: () => void): void => {
  if (activeNotice !== null) return
  const notice = Symbol('unconfirmed-sign-out-notice')
  activeNotice = notice

  const onRetry = (): void => {
    retry()
  }

  ToastNotifications.showError({
    timeout: null,
    onDismiss: () => {
      if (activeNotice === notice) {
        activeNotice = null
      }
    },
    text: (
      <span data-cy="unconfirmed-sign-out-notice">
        We could not confirm that you were signed out. You may still be signed in.
        <Button
          data-cy="unconfirmed-sign-out-retry"
          size="small"
          color="inherit"
          onClick={onRetry}
          sx={{ marginLeft: '0.5rem', textTransform: 'none', textDecoration: 'underline' }}
        >
          Retry
        </Button>
      </span>
    ),
  })
}

export const resetSignOutNoticeState = (): void => {
  activeNotice = null
}
