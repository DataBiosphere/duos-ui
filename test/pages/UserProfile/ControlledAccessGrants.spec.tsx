import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ControlledAccessGrants from 'src/pages/user_profile/ControlledAccessGrants'
import { formatDate } from 'src/libs/utils'

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getApprovedDatasets: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: {
      showError: vi.fn(),
    },
  }
})

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'

describe('ControlledAccessGrants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header title and description', async () => {
    vi.mocked(User.getApprovedDatasets).mockResolvedValue([])

    render(<ControlledAccessGrants />)

    await waitFor(() => {
      expect(screen.getByText('My Dataset Approvals')).toBeInTheDocument()
      expect(screen.getByText('Your current dataset approvals')).toBeInTheDocument()
    })
  })

  it('renders all expected column headers', async () => {
    vi.mocked(User.getApprovedDatasets).mockResolvedValue([])

    render(<ControlledAccessGrants />)

    await waitFor(() => {
      expect(screen.getByText('DAR Code')).toBeInTheDocument()
      expect(screen.getByText('Dataset Identifier')).toBeInTheDocument()
      expect(screen.getByText('Dataset Name')).toBeInTheDocument()
      expect(screen.getByText('DAC Name')).toBeInTheDocument()
      expect(screen.getByText('Expiration Date')).toBeInTheDocument()
    })
  })

  it('renders dataset rows returned by the API', async () => {
    const mockDatasets = [
      {
        darCode: 'DAR-001',
        datasetIdentifier: 'DS-123',
        datasetName: 'Test Dataset 1',
        dacName: 'DAC 1',
        expirationDate: 1742014831956,
      },
      {
        darCode: 'DAR-002',
        datasetIdentifier: 'DS-456',
        datasetName: 'Test Dataset 2',
        dacName: 'DAC 2',
        expirationDate: 1752014831956,
      },
    ]

    vi.mocked(User.getApprovedDatasets).mockResolvedValue(mockDatasets as any)

    render(<ControlledAccessGrants />)

    await waitFor(() => {
      expect(screen.getByText('DAR-001')).toBeInTheDocument()
      expect(screen.getByText('DS-123')).toBeInTheDocument()
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument()
      expect(screen.getByText('DAC 1')).toBeInTheDocument()
      expect(screen.getByText(formatDate(1742014831956))).toBeInTheDocument()

      expect(screen.getByText('DAR-002')).toBeInTheDocument()
      expect(screen.getByText('DS-456')).toBeInTheDocument()
      expect(screen.getByText('Test Dataset 2')).toBeInTheDocument()
      expect(screen.getByText('DAC 2')).toBeInTheDocument()
      expect(screen.getByText(formatDate(1752014831956))).toBeInTheDocument()
    })
  })

  it('shows an error notification when the API call fails', async () => {
    vi.mocked(User.getApprovedDatasets).mockRejectedValue(new Error('network error'))

    render(<ControlledAccessGrants />)

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error: Unable to retrieve user data from server',
      })
    })
  })
})
