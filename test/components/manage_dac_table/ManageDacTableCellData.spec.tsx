import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import {
  nameCellData,
  descriptionCellData,
  datasetsCellData,
  actionsCellData,
} from 'src/components/manage_dac_table/ManageDacTableCellData'
import type { DacObject, Dataset } from 'src/types/model'

const baseDac: DacObject = {
  dacId: 42,
  name: 'Test DAC',
  description: 'A test DAC',
  datasets: [],
}

const renderNode = (node: React.ReactNode) =>
  render(<BrowserRouter>{node}</BrowserRouter>)

describe('ManageDacTableCellData', () => {
  describe('nameCellData', () => {
    it('renders a link to the DAC profile page', () => {
      const cell = nameCellData({ name: 'Test DAC', dacId: 42 })
      renderNode(cell.data)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/manage_dac/42')
      expect(link).toHaveTextContent('Test DAC')
    })

    it('falls back to "- -" when name is empty', () => {
      const cell = nameCellData({ name: '', dacId: 1 })
      renderNode(cell.data)
      expect(screen.getByText('- -')).toBeInTheDocument()
    })

    it('sets the correct label and id', () => {
      const cell = nameCellData({ dacId: 7, label: 'custom-label' })
      expect(cell.id).toBe(7)
      expect(cell.label).toBe('custom-label')
      expect(cell.isComponent).toBe(true)
    })
  })

  describe('descriptionCellData', () => {
    it('returns the description text', () => {
      const cell = descriptionCellData({ description: 'Some description', dacId: 1 })
      expect(cell.data).toBe('Some description')
      expect(cell.id).toBe(1)
    })

    it('returns "- -" when description is empty', () => {
      const cell = descriptionCellData({ description: '', dacId: 1 })
      expect(cell.data).toBe('- -')
    })

    it('uses default label', () => {
      const cell = descriptionCellData({ dacId: 1 })
      expect(cell.label).toBe('dac-description')
    })
  })

  describe('datasetsCellData', () => {
    it('shows the count of approved datasets', () => {
      const dac: DacObject = {
        ...baseDac,
        datasets: [
          { datasetId: 1, dacApproval: true } as Dataset,
          { datasetId: 2, dacApproval: true } as Dataset,
          { datasetId: 3, dacApproval: false } as Dataset,
        ],
      }
      const cell = datasetsCellData({ dac, viewDatasets: vi.fn() })
      renderNode(cell.data)
      expect(screen.getByRole('button')).toHaveTextContent('2')
    })

    it('excludes datasets that are not approved', () => {
      const dac: DacObject = {
        ...baseDac,
        datasets: [
          { datasetId: 1, dacApproval: true } as Dataset,
          { datasetId: 2, dacApproval: false } as Dataset,
          { datasetId: 3 } as Dataset,
        ],
      }
      const cell = datasetsCellData({ dac, viewDatasets: vi.fn() })
      renderNode(cell.data)
      expect(screen.getByRole('button')).toHaveTextContent('1')
    })

    it('shows 0 when dac has no datasets', () => {
      const cell = datasetsCellData({ dac: baseDac, viewDatasets: vi.fn() })
      renderNode(cell.data)
      expect(screen.getByRole('button')).toHaveTextContent('0')
    })

    it('calls viewDatasets when button is clicked', () => {
      const viewDatasets = vi.fn()
      const cell = datasetsCellData({ dac: baseDac, viewDatasets })
      renderNode(cell.data)
      fireEvent.click(screen.getByRole('button'))
      expect(viewDatasets).toHaveBeenCalledWith(baseDac)
    })
  })

  describe('actionsCellData', () => {
    it('shows edit link for all roles', () => {
      const cell = actionsCellData({ dac: baseDac, deleteDac: vi.fn(), userRole: 'Chairperson' })
      renderNode(cell.data)
      expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/manage_dac/42')
    })

    it('shows delete button for Admin role', () => {
      const cell = actionsCellData({ dac: baseDac, deleteDac: vi.fn(), userRole: 'Admin' })
      const { container } = renderNode(cell.data)
      expect(container.querySelector('[data-tip="Delete DAC"]')).toBeInTheDocument()
    })

    it('hides delete button for non-Admin role', () => {
      const cell = actionsCellData({ dac: baseDac, deleteDac: vi.fn(), userRole: 'Chairperson' })
      const { container } = renderNode(cell.data)
      expect(container.querySelector('[data-tip="Delete DAC"]')).not.toBeInTheDocument()
    })

    it('disables delete when dac has datasets', () => {
      const dacWithDatasets: DacObject = { ...baseDac, datasets: [{ datasetId: 1 } as Dataset] }
      const cell = actionsCellData({ dac: dacWithDatasets, deleteDac: vi.fn(), userRole: 'Admin' })
      const { container } = renderNode(cell.data)
      const span = container.querySelector('[data-tip="All datasets assigned to this DAC must be reassigned before this can be deleted"]')
      expect(span).toBeInTheDocument()
      expect(span).toHaveAttribute('disabled')
    })

    it('calls deleteDac when delete span is clicked', () => {
      const deleteDac = vi.fn()
      const cell = actionsCellData({ dac: baseDac, deleteDac, userRole: 'Admin' })
      const { container } = renderNode(cell.data)
      const span = container.querySelector('[data-tip="Delete DAC"]') as HTMLElement
      fireEvent.click(span)
      expect(deleteDac).toHaveBeenCalledWith(baseDac)
    })
  })
})
