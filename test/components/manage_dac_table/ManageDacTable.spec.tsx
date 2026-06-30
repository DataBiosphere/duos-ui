import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ManageDacTable } from 'src/components/manage_dac_table/ManageDacTable'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import type { DacObject, Dataset } from 'src/types/model'

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: { datasets: vi.fn() },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...actual,
    recalculateVisibleTable: vi.fn(async ({ filteredList, setVisibleList, setPageCount }: {
      filteredList: unknown[]
      setVisibleList: (list: unknown[]) => void
      setPageCount: (count: number) => void
    }) => {
      setVisibleList(filteredList ?? [])
      setPageCount(1)
    }),
    Notifications: { showError: vi.fn() },
  }
})

vi.mock('src/components/manage_dac_table/ManageDacTableCellData', () => ({
  default: {
    nameCellData: ({ name, dacId }: { name?: string, dacId?: number }) => ({
      id: dacId, label: 'dac-name', data: <span data-testid={`dac-name-${dacId}`}>{name ?? '- -'}</span>,
    }),
    descriptionCellData: ({ description, dacId }: { description?: string, dacId?: number }) => ({
      id: dacId, label: 'dac-description', data: <span>{description ?? '- -'}</span>,
    }),
    datasetsCellData: ({ dac, viewDatasets }: { dac: DacObject, viewDatasets: (d: DacObject) => void }) => ({
      id: dac.dacId, label: 'dac-datasets', isComponent: true,
      data: <button data-testid={`view-datasets-${dac.dacId}`} onClick={() => viewDatasets(dac)}>Datasets</button>,
    }),
    actionsCellData: ({ dac, deleteDac }: { dac: DacObject, deleteDac: (d: DacObject) => void }) => ({
      id: dac.dacId, label: 'table-actions', isComponent: true,
      data: <button data-testid={`delete-dac-${dac.dacId}`} onClick={() => deleteDac(dac)}>Delete</button>,
    }),
  },
}))

vi.mock('src/components/SimpleTable', () => ({
  default: ({ isLoading, rowData }: {
    isLoading: boolean
    rowData: Array<Array<{ data: React.ReactNode, label: string }>>
  }) => (
    <div data-testid="simple-table">
      {isLoading && <div data-testid="loading">Loading...</div>}
      {rowData.map((row, i) => (
        <div key={i} data-testid="table-row">
          {row.map(cell => <div key={cell.label}>{cell.data}</div>)}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('src/components/PaginationBar', () => ({
  default: () => <div data-testid="pagination-bar" />,
}))

vi.mock('react-tooltip', () => ({
  Tooltip: () => null,
}))

const dac1: DacObject = { dacId: 1, name: 'DAC One', description: 'First DAC', datasets: [] }
const dac2: DacObject = { dacId: 2, name: 'DAC Two', description: 'Second DAC', datasets: [] }

const baseProps = {
  isLoading: false,
  dacs: [dac1, dac2],
  userRole: 'Admin',
  onViewDatasets: vi.fn(),
  setShowConfirmationModal: vi.fn(),
  setSelectedDac: vi.fn(),
}

describe('ManageDacTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading indicator when isLoading is true', async () => {
    await act(async () => {
      render(<ManageDacTable {...baseProps} isLoading={true} />)
    })
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('renders a row for each dac', async () => {
    await act(async () => {
      render(<ManageDacTable {...baseProps} />)
    })
    expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    expect(screen.getByTestId('dac-name-1')).toHaveTextContent('DAC One')
    expect(screen.getByTestId('dac-name-2')).toHaveTextContent('DAC Two')
  })

  it('calls setShowConfirmationModal and setSelectedDac when delete is clicked', async () => {
    const setShowConfirmationModal = vi.fn()
    const setSelectedDac = vi.fn()
    await act(async () => {
      render(<ManageDacTable {...baseProps} setShowConfirmationModal={setShowConfirmationModal} setSelectedDac={setSelectedDac} />)
    })
    fireEvent.click(screen.getByTestId('delete-dac-1'))
    expect(setShowConfirmationModal).toHaveBeenCalledWith(true)
    expect(setSelectedDac).toHaveBeenCalledWith(dac1)
  })

  it('calls onViewDatasets with approved datasets when view datasets is clicked', async () => {
    const approvedDataset = { datasetId: 10, dacApproval: true } as Dataset
    const unapprovedDataset = { datasetId: 11, dacApproval: false } as Dataset
    vi.mocked(DAC.datasets).mockResolvedValue([approvedDataset, unapprovedDataset])
    const onViewDatasets = vi.fn()

    await act(async () => {
      render(<ManageDacTable {...baseProps} onViewDatasets={onViewDatasets} />)
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('view-datasets-1'))
    })
    expect(DAC.datasets).toHaveBeenCalledWith(1)
    expect(onViewDatasets).toHaveBeenCalledWith(dac1, [approvedDataset])
  })

  it('shows an error notification when DAC.datasets fails', async () => {
    vi.mocked(DAC.datasets).mockRejectedValue(new Error('Network error'))

    await act(async () => {
      render(<ManageDacTable {...baseProps} />)
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('view-datasets-1'))
    })
    expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Failed to load datasets.' })
  })

  it('renders empty table when no dacs are provided', async () => {
    await act(async () => {
      render(<ManageDacTable {...baseProps} dacs={[]} />)
    })
    expect(screen.queryAllByTestId('table-row')).toHaveLength(0)
  })
})
