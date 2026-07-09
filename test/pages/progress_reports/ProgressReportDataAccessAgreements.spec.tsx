import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ProgressReportDataAccessAgreements from 'src/pages/progress_reports/ProgressReportDataAccessAgreements'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, Dataset, FileStorageObject } from 'src/types/model'

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: {
    getDaas: vi.fn(),
    getDaaFileById: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: { showError: vi.fn() },
}))

const fso = (id: number, fileName: string): FileStorageObject => ({
  fileStorageObjectId: id,
  entityId: String(id),
  fileName,
  category: 'dataAccessAgreement',
  mediaType: 'application/pdf',
  createUserId: 1,
  createDate: 1,
})

const daa1: DAAObject = {
  daaId: 100,
  createUserId: 1,
  createDate: '2024-01-01',
  updateUserId: 1,
  updateDate: '2024-01-01',
  initialDacId: 2,
  file: fso(1, 'TestDAA.pdf'),
  dacs: [{ dacId: 2, dacName: 'Test DAC' }],
}

const daa2: DAAObject = {
  daaId: 101,
  createUserId: 1,
  createDate: '2024-01-01',
  updateUserId: 1,
  updateDate: '2024-01-01',
  initialDacId: 3,
  file: fso(2, 'OtherDAA.pdf'),
  dacs: [{ dacId: 3, dacName: 'Other DAC' }],
}

const dataset1 = { datasetId: 1, dacId: 2 } as Dataset
const dataset2 = { datasetId: 2, dacId: 3 } as Dataset

describe('ProgressReportDataAccessAgreements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the section heading', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([daa1, daa2])
    await act(async () => {
      render(
        <ProgressReportDataAccessAgreements
          datasets={[dataset1, dataset2]}
          onDaaIdsChange={vi.fn()}
        />,
      )
    })
    expect(screen.getByText('Step 2.1: Required Data Access Agreements')).toBeVisible()
  })

  it('fetches DAAs on mount and renders download buttons for matching datasets', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([daa1, daa2])
    await act(async () => {
      render(
        <ProgressReportDataAccessAgreements
          datasets={[dataset1, dataset2]}
          onDaaIdsChange={vi.fn()}
        />,
      )
    })
    await waitFor(() => {
      expect(screen.getByText('TestDAA')).toBeVisible()
      expect(screen.getByText('OtherDAA')).toBeVisible()
    })
  })

  it('calls onDaaIdsChange with IDs of DAAs matching the provided datasets', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([daa1, daa2])
    const onDaaIdsChange = vi.fn()
    await act(async () => {
      render(
        <ProgressReportDataAccessAgreements
          datasets={[dataset1, dataset2]}
          onDaaIdsChange={onDaaIdsChange}
        />,
      )
    })
    await waitFor(() => {
      expect(onDaaIdsChange).toHaveBeenCalledWith([100, 101])
    })
  })

  it('updates required DAA IDs when selected datasets change', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([daa1, daa2])
    const onDaaIdsChange = vi.fn()
    const { rerender } = render(
      <ProgressReportDataAccessAgreements
        datasets={[dataset1, dataset2]}
        onDaaIdsChange={onDaaIdsChange}
      />,
    )
    await waitFor(() => {
      expect(onDaaIdsChange).toHaveBeenCalledWith([100, 101])
    })

    onDaaIdsChange.mockClear()
    await act(async () => {
      rerender(
        <ProgressReportDataAccessAgreements
          datasets={[dataset1]}
          onDaaIdsChange={onDaaIdsChange}
        />,
      )
    })
    await waitFor(() => {
      expect(onDaaIdsChange).toHaveBeenCalledWith([100])
    })
  })

  it('shows error message when DAA fetch fails', async () => {
    vi.mocked(DAA.getDaas).mockRejectedValue(new Error('Network error'))
    await act(async () => {
      render(
        <ProgressReportDataAccessAgreements
          datasets={[dataset1]}
          onDaaIdsChange={vi.fn()}
        />,
      )
    })
    await waitFor(() => {
      expect(screen.getByText(/Unable to retrieve required data access agreements/)).toBeVisible()
    })
  })
})
