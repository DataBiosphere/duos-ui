import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { act } from 'react'
import ManageRadar from 'src/pages/manage_dac/ManageRadar'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { setUserRoleStatuses } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: {
    get: vi.fn(),
    fetchDACbotRules: vi.fn(),
  },
}))

const dac = {
  dacId: 1,
  name: 'Test DAC',
  description: 'Test DAC',
  createDate: 'Oct 6, 2020',
  updateDate: 'Jun 27, 2024',
  chairpersons: [],
  members: [],
  electionIds: [],
  datasetIds: [],
}

const admin = {
  userId: 2,
  displayName: 'Admin',
  institution: { id: 150, name: 'The Broad Institute of MIT and Harvard' },
  roles: [{ userId: 2, roleId: 4, name: 'Admin' }],
} as unknown as DuosUser

// Chair fixture: dacId=1 in the role, component is mounted with dacId=123 (mismatched).
// ManageRadar doesn't gate on role, so both admin and
// chair render identically — the setup call still exercises the setUserRoleStatuses path.
const chair = {
  userId: 1,
  displayName: 'Chairperson',
  institution: { id: 150, name: 'The Broad Institute of MIT and Harvard' },
  roles: [{ userId: 1, roleId: 2, name: 'Chairperson', dacId: 1 }],
} as unknown as DuosUser

const mockDacId = 123

const renderManageRadar = (dacId: number | undefined) => {
  return render(
    <MemoryRouter initialEntries={[`/manage_radar/${dacId}`]}>
      <Routes>
        <Route path="/manage_radar/:dacId" element={<ManageRadar />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ManageRadar Component Tests', () => {
  beforeEach(() => {
    vi.spyOn(Storage, 'setCurrentUser').mockImplementation(() => {})
    vi.mocked(DAC.fetchDACbotRules).mockResolvedValue([])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the ManageRadar component with loading state', () => {
      vi.mocked(DAC.get).mockReturnValue(new Promise(() => {}))
      const { container } = renderManageRadar(mockDacId)
      expect(container.querySelector('[data-cy="loading-spinner"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="loading-spinner"] img[alt="spinner"]')).toBeInTheDocument()
    })

    it('should render with DAC data after loading completes', async () => {
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      expect(container).toHaveTextContent(dac.name)
      expect(container.querySelector('[data-cy="back-button"]')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle DAC fetch errors gracefully', async () => {
      vi.mocked(DAC.get).mockRejectedValue(new Error('Failed to fetch DAC'))
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="error-container"]')).toBeInTheDocument())
      expect(container.querySelector('[data-cy="error-message"]')).toHaveTextContent('Error loading DAC information')
      expect(container.querySelector('[data-cy="back-button"]')).toBeInTheDocument()
    })

    it('should handle missing DAC ID parameter', async () => {
      const { container } = renderManageRadar(undefined)
      await waitFor(() => expect(container.querySelector('[data-cy="error-container"]')).toBeInTheDocument())
      expect(container.querySelector('[data-cy="error-message"]')).toHaveTextContent('Invalid DAC ID')
      expect(container.querySelector('[data-cy="back-button"]')).toBeInTheDocument()
    })
  })

  describe('User Role Integration', () => {
    it('should render correctly for admin users', async () => {
      setUserRoleStatuses(admin, Storage)
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      expect(container).toHaveTextContent(dac.name)
      await waitFor(() => expect(container.querySelector('[data-cy="dac-bot-component"]')).toBeInTheDocument())
    })

    it('should render correctly for chair users', async () => {
      setUserRoleStatuses(chair, Storage)
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      expect(container).toHaveTextContent(dac.name)
      await waitFor(() => expect(container.querySelector('[data-cy="dac-bot-component"]')).toBeInTheDocument())
    })
  })

  describe('Navigation', () => {
    it('should have working back button', async () => {
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      const backButton = container.querySelector('[data-cy="back-button"]')!
      expect(backButton).toBeVisible()
      expect(backButton).toHaveAttribute('href', '/manage_dac')
      expect(backButton.querySelector('img[alt="Back"]')).toBeInTheDocument()
    })

    it('should show back button link', async () => {
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      expect(container.querySelector('[data-cy="back-button"]')).toBeInTheDocument()
    })
  })

  describe('Page Layout and Structure', () => {
    it('should be visible on different screen sizes', async () => {
      setUserRoleStatuses(admin, Storage)
      vi.mocked(DAC.get).mockResolvedValue(dac)

      // Mount once at mobile size
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 })
      window.dispatchEvent(new Event('resize'))
      const { container } = renderManageRadar(mockDacId)

      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeVisible()

      // Tablet — same mounted component, resize only
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 })
      window.dispatchEvent(new Event('resize'))
      expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeVisible()

      // Desktop — same mounted component, resize only
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
      window.dispatchEvent(new Event('resize'))
      expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeVisible()
    })

    it('should have proper page structure', async () => {
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeInTheDocument())
      await waitFor(() => expect(container.querySelector('[data-cy="table-header-description"]')).toBeInTheDocument())
      expect(container.querySelector('[data-cy="table-header-description"]')).toHaveTextContent(dac.name)
      expect(container.querySelector('[data-cy="back-button"]')).toBeInTheDocument()
      await waitFor(() => expect(container.querySelector('[data-cy="dac-bot-component"]')).toBeInTheDocument())
    })
  })

  describe('Data Consistency', () => {
    it('should maintain consistent state during DAC loading', async () => {
      let resolvePromise!: (value: unknown) => void
      const dacPromise = new Promise(resolve => resolvePromise = resolve)
      vi.mocked(DAC.get).mockReturnValue(dacPromise as never)

      const { container } = renderManageRadar(mockDacId)

      expect(container.querySelector('[data-cy="loading-spinner"]')).toBeInTheDocument()
      expect(container.querySelector('[data-cy="dac-bot-component"]')).not.toBeInTheDocument()

      await act(async () => resolvePromise(dac))

      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      await waitFor(() => expect(container.querySelector('[data-cy="dac-bot-component"]')).toBeInTheDocument())
    })
  })
})
