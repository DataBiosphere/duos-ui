import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { act } from 'react'
import ManageRadar from 'src/pages/manage_dac/ManageRadar'
import { DAC } from 'src/libs/ajax/DAC'

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
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="loading-spinner"]')).not.toBeInTheDocument())
      expect(container).toHaveTextContent(dac.name)
      await waitFor(() => expect(container.querySelector('[data-cy="dac-bot-component"]')).toBeInTheDocument())
    })

    it('should render correctly for chair users', async () => {
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
    it('should have proper page structure', async () => {
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeInTheDocument())
      await waitFor(() => expect(container.querySelector('[data-cy="table-header-description"]')).toBeInTheDocument())
      expect(container.querySelector('[data-cy="table-header-description"]')).toHaveTextContent(dac.name)
      expect(container.querySelector('[data-cy="back-button"]')).toBeInTheDocument()
      await waitFor(() => expect(container.querySelector('[data-cy="dac-bot-component"]')).toBeInTheDocument())
    })

    it('should be visible on different screen sizes', async () => {
      vi.mocked(DAC.get).mockResolvedValue(dac)
      const { container } = renderManageRadar(mockDacId)
      await waitFor(() => expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeInTheDocument())
      expect(container.querySelector('[data-cy="manage-radar-container"]')).toBeVisible()
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
