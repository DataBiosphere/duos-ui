import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import AcceptedAcknowledgements from 'src/pages/user_profile/AcceptedAcknowledgements'
import { AcknowledgementMap } from 'src/types/model'

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getAcknowledgements: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showError: vi.fn(),
  },
}))

import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'

const mockAcknowledgements: AcknowledgementMap = {
  'duos-research-purpose': {
    userId: 1,
    ackKey: 'DUOS Research Purpose Policy',
    firstAcknowledged: new Date('2024-03-15').getTime(),
    lastAcknowledged: new Date('2024-03-15').getTime(),
  },
  'duos-privacy-policy': {
    userId: 1,
    ackKey: 'DUOS Privacy Policy',
    firstAcknowledged: new Date('2024-04-01').getTime(),
    lastAcknowledged: new Date('2024-04-01').getTime(),
  },
}

describe('AcceptedAcknowledgements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('always shows the DUOS/Terra Terms of Service entry', async () => {
    vi.mocked(User.getAcknowledgements).mockResolvedValue({})
    render(<AcceptedAcknowledgements />)
    await waitFor(() => {
      expect(screen.getByText('DUOS/Terra Terms of Service')).toBeInTheDocument()
    })
  })

  it('shows "No Accepted Terms & Policies Found" when there are no acknowledgements', async () => {
    vi.mocked(User.getAcknowledgements).mockResolvedValue({})
    render(<AcceptedAcknowledgements />)
    await waitFor(() => {
      expect(screen.getByText('No Accepted Terms & Policies Found')).toBeInTheDocument()
    })
  })

  it('renders an entry for each acknowledgement returned by the API', async () => {
    vi.mocked(User.getAcknowledgements).mockResolvedValue(mockAcknowledgements)
    render(<AcceptedAcknowledgements />)
    await waitFor(() => {
      expect(screen.getByText('DUOS Research Purpose Policy')).toBeInTheDocument()
      expect(screen.getByText('DUOS Privacy Policy')).toBeInTheDocument()
    })
  })

  it('formats and displays the attestedTime for each acknowledgement', async () => {
    vi.mocked(User.getAcknowledgements).mockResolvedValue(mockAcknowledgements)
    render(<AcceptedAcknowledgements />)

    const date = new Date(mockAcknowledgements['duos-research-purpose'].lastAcknowledged)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    const expectedDate = `${month}/${day}/${year}`

    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(expectedDate))[0]).toBeInTheDocument()
    })
  })

  it('shows an error notification when the API call fails', async () => {
    vi.mocked(User.getAcknowledgements).mockRejectedValue(new Error('network error'))
    render(<AcceptedAcknowledgements />)
    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error: Unable to retrieve user data from server',
      })
    })
  })
})
