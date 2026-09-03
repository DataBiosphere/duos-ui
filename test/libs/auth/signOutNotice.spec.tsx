import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { showUnconfirmedSignOutNotice, resetSignOutNoticeState } from 'src/libs/auth/signOutNotice'
import { ToastNotifications } from 'src/libs/ToastNotifications'

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

  it('tells the user the session may still be live, and offers a Retry', () => {
    showUnconfirmedSignOutNotice(() => {})
    const { text } = noticeSpy.mock.calls[0][0] as { text: React.ReactNode }

    render(<>{text}</>)

    expect(screen.getByText(/could not confirm that you were signed out/i)).toBeInTheDocument()
    // The notice asks for the click outright — a Retry button alone leaves the
    // user guessing what to do about it.
    expect(screen.getByText(/select retry to try again/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('runs the caller\'s retry when Retry is clicked', () => {
    const retry = vi.fn()
    showUnconfirmedSignOutNotice(retry)
    const { text } = noticeSpy.mock.calls[0][0] as { text: React.ReactNode }

    render(<>{text}</>)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('shows only one notice at a time', () => {
    showUnconfirmedSignOutNotice(() => {})
    showUnconfirmedSignOutNotice(() => {})
    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(1)
  })

  it('can report again after the notice is dismissed', () => {
    showUnconfirmedSignOutNotice(() => {})
    const { onDismiss } = noticeSpy.mock.calls[0][0] as { onDismiss: () => void }

    onDismiss()
    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(2)
  })

  it('holds the guard across Retry, so an unconfirmed retry reuses this notice', () => {
    showUnconfirmedSignOutNotice(() => {})
    const { text } = noticeSpy.mock.calls[0][0] as { text: React.ReactNode }
    render(<>{text}</>)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(1)
  })

  it('ignores a late dismissal from a superseded notice', () => {
    showUnconfirmedSignOutNotice(() => {})
    const first = noticeSpy.mock.calls[0][0] as { onDismiss: () => void }
    first.onDismiss()
    showUnconfirmedSignOutNotice(() => {})
    expect(noticeSpy).toHaveBeenCalledTimes(2)

    first.onDismiss()
    showUnconfirmedSignOutNotice(() => {})

    expect(noticeSpy).toHaveBeenCalledTimes(2)
  })
})

describe('showUnconfirmedSignOutNotice through the real toast', () => {
  beforeEach(() => {
    resetSignOutNoticeState()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    Array.from(document.body.children)
      .filter(el => el.querySelector('[data-cy="notification-alert"]') || el.querySelector('.MuiSnackbar-root'))
      .forEach(el => el.remove())
    vi.clearAllTimers()
    vi.useRealTimers()
    resetSignOutNoticeState()
  })

  const alerts = (): NodeListOf<Element> => document.querySelectorAll('[data-cy="notification-alert"]')

  it('shows a second notice after the first is closed', async () => {
    await act(async () => {
      showUnconfirmedSignOutNotice(() => {})
    })
    expect(alerts()).toHaveLength(1)

    const closeButton = document.querySelector('[data-cy="notification-alert"] .MuiAlert-action button') as HTMLElement
    fireEvent.click(closeButton)
    await act(async () => {
      vi.advanceTimersByTime(350)
    })
    expect(alerts()).toHaveLength(0)

    await act(async () => {
      showUnconfirmedSignOutNotice(() => {})
    })

    expect(alerts()).toHaveLength(1)
  })

  it('does not stack a second notice when the retry is also unconfirmed', async () => {
    const retry = (): void => {
      showUnconfirmedSignOutNotice(retry)
    }
    await act(async () => {
      showUnconfirmedSignOutNotice(retry)
    })
    expect(alerts()).toHaveLength(1)

    fireEvent.click(document.querySelector('[data-cy="unconfirmed-sign-out-retry"]') as HTMLElement)
    await act(async () => {})

    expect(alerts()).toHaveLength(1)
  })

  it('still shows only one notice while the first is on screen', async () => {
    await act(async () => {
      showUnconfirmedSignOutNotice(() => {})
      showUnconfirmedSignOutNotice(() => {})
    })

    expect(alerts()).toHaveLength(1)
  })
})
