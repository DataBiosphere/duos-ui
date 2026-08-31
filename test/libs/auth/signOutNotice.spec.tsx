import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { showUnconfirmedSignOutNotice, resetSignOutNoticeState } from 'src/libs/auth/signOutNotice'
import { ToastNotifications } from 'src/libs/ToastNotifications'

/*
  Story 5-E: an unconfirmed sign-out is security-relevant, so its notice must
  persist until dismissed and must offer a Retry that starts a fresh attempt.
*/

describe('showUnconfirmedSignOutNotice', () => {
  let noticeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetSignOutNoticeState()
    noticeSpy = vi.spyOn(ToastNotifications, 'showError').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetSignOutNoticeState()
  })

  it('dispatches an error notice that never auto-hides', () => {
    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(1)
    expect(noticeSpy.mock.calls[0][0]).toMatchObject({ timeout: null })
  })

  it('tells the user the session may still be live, and offers a Retry', async () => {
    showUnconfirmedSignOutNotice(() => {})
    const { text } = noticeSpy.mock.calls[0][0] as { text: React.ReactNode }

    await act(async () => {
      render(<>{text}</>)
    })

    expect(screen.getByText(/could not confirm that you were signed out/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('runs the caller\'s retry when Retry is clicked', async () => {
    const retry = vi.fn()
    showUnconfirmedSignOutNotice(retry)
    const { text } = noticeSpy.mock.calls[0][0] as { text: React.ReactNode }

    await act(async () => {
      render(<>{text}</>)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    })

    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('shows only one notice at a time', () => {
    showUnconfirmedSignOutNotice(() => {})
    showUnconfirmedSignOutNotice(() => {})
    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(1)
  })

  it('can report again after a retry, so a failed retry is not silent', async () => {
    showUnconfirmedSignOutNotice(() => {})
    const { text } = noticeSpy.mock.calls[0][0] as { text: React.ReactNode }
    await act(async () => {
      render(<>{text}</>)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    })

    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(2)
  })
})
