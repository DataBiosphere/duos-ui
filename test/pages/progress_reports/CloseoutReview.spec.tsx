import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CloseoutReview } from 'src/pages/progress_reports/CloseoutReview'
import { Acknowledgement, DataAccessRequest, DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getAcknowledgement: vi.fn(),
    acceptAcknowledgments: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/DAR', () => ({
  DAR: { approveCloseout: vi.fn() },
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: { showSuccess: vi.fn(), showError: vi.fn() },
}))

import { User } from 'src/libs/ajax/User'
import { DAR } from 'src/libs/ajax/DAR'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'

const mockDar: DataAccessRequest = {
  referenceId: 'DAR-UUID',
} as DataAccessRequest

const mockUser = { isSigningOfficial: true }

function renderComponent(overrides: Partial<{ dar: DataAccessRequest, onReturn: () => void }> = {}) {
  const onReturn = overrides.onReturn ?? vi.fn()
  render(
    <CloseoutReview
      dar={overrides.dar ?? mockDar}
      onReturn={onReturn}
    />,
  )
  return { onReturn }
}

describe('CloseoutReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(mockUser as unknown as DuosUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the component correctly', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      expect(document.querySelector('[data-cy="closeout-review"]')).toBeVisible()
      expect(document.querySelector('.MuiSvgIcon-root')).toBeVisible()
      expect(screen.getByText('Please note:')).toBeVisible()
      expect(screen.getByText(/If there are issues with the content/)).toBeVisible()
    })
  })

  it('displays both buttons with correct text', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve closeout' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Go to Data Access Requests' })).toBeVisible()
    })
  })

  it('calls onApprove when Approve closeout button is clicked', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(false as unknown as Acknowledgement)
    vi.mocked(DAR.approveCloseout).mockResolvedValue(1)

    renderComponent()

    const approveButton = await screen.findByRole('button', { name: 'Approve closeout' })

    await act(async () => {
      fireEvent.click(approveButton)
    })

    await waitFor(() => {
      expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Closeout review approved successfully.' })
    })
  })

  it('calls onReturn when Go to Data Access Requests button is clicked', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)
    const onReturnSpy = vi.fn()

    renderComponent({ onReturn: onReturnSpy })

    const returnButton = await screen.findByRole('button', { name: 'Go to Data Access Requests' })
    fireEvent.click(returnButton)

    expect(onReturnSpy).toHaveBeenCalledOnce()
  })

  it('maintains proper layout with icon, text, and buttons', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      expect(document.querySelector('[data-cy="closeout-review"]')).toBeVisible()
      expect(document.querySelector('.MuiSvgIcon-root')).toBeVisible()
      expect(screen.getByText('Please note:')).toBeVisible()
      expect(screen.getByText(/If there are issues with the content/)).toBeVisible()
      expect(screen.getByRole('button', { name: 'Approve closeout' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Go to Data Access Requests' })).toBeVisible()
      expect(document.querySelectorAll('button')).toHaveLength(2)
    })
  })

  it('displays "Please note:" text in bold', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Please note:')).toBeVisible()
      expect(screen.getByText('Please note:')).toHaveStyle({ fontWeight: 'bold' })
    })
  })

  it('displays explanatory text with normal font weight', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      const text = screen.getByText(/If there are issues with the content/)
      expect(text).toBeVisible()
      expect(text).not.toHaveStyle({ fontWeight: 'bold' })
    })
  })

  it('displays closeout approve button when no acknowledgement exists', async () => {
    vi.mocked(User.getAcknowledgement).mockResolvedValue(null as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      expect(document.querySelector('[data-cy="closeout-review"]')).toBeVisible()
      expect(document.querySelector('[data-cy="closeout-review-approve-button"]')).toBeVisible()
    })
  })

  it('hides closeout approve button when acknowledgement exists', async () => {
    const acknowledgement = { key: 'dar_closeout_chair_ref_DAR-UUID', value: 'true' }
    vi.mocked(User.getAcknowledgement).mockResolvedValue(acknowledgement as unknown as Acknowledgement)

    renderComponent()

    await waitFor(() => {
      expect(document.querySelector('[data-cy="closeout-review-approve-button"]')).not.toBeInTheDocument()
    })
  })
})
