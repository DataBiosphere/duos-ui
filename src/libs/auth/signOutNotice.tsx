import React from 'react'
import { Button } from '@mui/material'
import { ToastNotifications } from 'src/libs/ToastNotifications'

/**
 * The "sign-out could not be confirmed" notice (BFF Phase 5, story 5-E).
 *
 * When Auth.signOut cannot confirm that the BFF session is gone, it performs
 * no local cleanup and claims no success — so something must tell the user.
 * Every sign-out caller needs a notice owner, including the non-UI one: on the
 * automatic terminal-401 path the caller is the fetch adapter, not a
 * component, so a discarded result would silently leave the user on the page
 * believing they signed out.
 *
 * The notice is security-relevant, so it does NOT auto-hide (timeout: null)
 * and it carries a Retry that starts a FRESH sign-out attempt.
 */

/** One notice at a time: concurrent 401s share one sign-out attempt, but each
 *  caller consumes the same result and would otherwise stack a toast apiece.
 *  The flag clears the moment the notice leaves the screen — on Retry, and on
 *  a dismissal through the toast's own close button — or a later, unrelated
 *  unconfirmed sign-out would be suppressed in silence. */
let noticePending = false

export const showUnconfirmedSignOutNotice = (retry: () => void): void => {
  if (noticePending) return
  noticePending = true

  const onRetry = (): void => {
    noticePending = false
    retry()
  }

  ToastNotifications.showError({
    // Persistent: a security-relevant Retry cannot auto-hide.
    timeout: null,
    onDismiss: () => {
      noticePending = false
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

/** Test seam: forget that a notice is on screen. */
export const resetSignOutNoticeState = (): void => {
  noticePending = false
}
