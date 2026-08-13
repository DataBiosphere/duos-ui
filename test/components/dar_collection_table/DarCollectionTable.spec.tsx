import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { DarCollectionTable, DarCollectionTableProps } from 'src/components/dar_collection_table/DarCollectionTable'
import type { CellData } from 'src/components/dar_collection_table/DarCollectionTableCellData'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'
import { recalculateVisibleTable } from 'src/libs/utils'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollection, DarCollectionSummary } from 'src/types/model'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'

type RecalcParams = Parameters<typeof recalculateVisibleTable>[0]

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUserSettings: vi.fn().mockReturnValue(null),
    setCurrentUserSettings: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async () => {
  const actual = await vi.importActual<typeof import('src/libs/utils')>('src/libs/utils')
  return {
    ...actual,
    recalculateVisibleTable: vi.fn(),
    Notifications: { showError: vi.fn() },
  }
})

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: { getCollectionById: vi.fn() },
}))

vi.mock('src/components/dar_collection_table/CollectionConfirmationModal', () => ({
  default: () => <div data-testid="confirmation-modal" />,
}))

vi.mock('src/components/dar_dataset_table/DarDatasetTable', () => ({
  DarDatasetTable: () => <div data-testid="dar-dataset-table" />,
}))

vi.mock('src/components/dar_collection_table/DarCollectionTableCellData', () => ({
  default: {
    darCodeCellData: ({
      darCode,
      darCollectionId,
      collectionIsExpanded,
      updateCollectionIsExpanded,
      status,
    }: {
      darCode: string
      darCollectionId: number
      collectionIsExpanded: boolean
      updateCollectionIsExpanded: (val: boolean) => void
      status: string
    }) => ({
      data: (
        <div>
          {(status || '').toLowerCase() !== 'draft' && (
            <button
              id={`${darCollectionId}_dropdown`}
              aria-label="expand"
              onClick={() => updateCollectionIsExpanded(!collectionIsExpanded)}
            />
          )}
          {darCode}
        </div>
      ),
      id: darCollectionId,
      label: 'dar-code',
      isComponent: true,
    }),
    DacCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'dacNames',
    }),
    projectTitleCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'project-title',
    }),
    submissionDateCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'submission-date',
    }),
    researcherCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'researcher',
    }),
    institutionCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'institution',
    }),
    datasetCountCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'datasets',
    }),
    expiresAtCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'expiration-date',
    }),
    statusCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'status',
    }),
    consoleActionsCellData: ({ darCollectionId }: { darCollectionId: number }) => ({
      data: '',
      id: darCollectionId,
      label: 'table-actions',
    }),
  },
}))

vi.mock('src/components/SimpleTable', () => ({
  default: ({
    isLoading,
    columnHeaders,
    rowData = [],
    rowWrapper = ({ renderedRow }: { renderedRow: React.ReactNode, rowData: CellData[] }) => renderedRow,
  }: {
    isLoading?: boolean
    columnHeaders: Array<{ label: string }>
    rowData?: CellData[][]
    rowWrapper?: (args: { renderedRow: React.ReactNode, rowData: CellData[] }) => React.ReactNode
  }) => (
    <div data-testid="simple-table">
      {isLoading && <div className="table-loading-placeholder" />}
      {columnHeaders.map((col, i) => (
        <div key={i} className="column-header">{col.label}</div>
      ))}
      {rowData.map((row, i) => {
        const renderedRow = (
          <div className="table-row">
            {row.map((cell, j) => <div key={j}>{cell.data}</div>)}
          </div>
        )
        return <div key={i}>{rowWrapper({ renderedRow, rowData: row })}</div>
      })}
    </div>
  ),
}))

const baseCollection: DarCollectionSummary = {
  darCollectionId: 211,
  darCode: 'DAR-259',
  name: 'Test Collection',
  actions: [],
  dacNames: ['DAC-A'],
  dacCode: '',
  datasetCount: 2,
  datasetIds: [1, 2],
  expired: false,
  expiresAt: 0,
  institutionName: 'Broad',
  latestReferenceId: 'ref-1',
  progressReport: false,
  referenceIds: ['ref-1'],
  requiresSOApproval: false,
  researcherName: 'Jane',
  status: 'Open',
  submissionDate: 0,
}

const baseProps: DarCollectionTableProps = {
  collections: [baseCollection],
  columns: [DarCollectionTableColumnOptions.DAR_CODE],
  isLoading: false,
  cancelCollection: vi.fn().mockResolvedValue(undefined),
  reviseCollection: null,
  openCollection: vi.fn().mockResolvedValue(undefined),
  deleteDraft: vi.fn().mockResolvedValue(undefined),
  approveCollection: vi.fn().mockResolvedValue(undefined),
}

function renderTable(overrides: Partial<DarCollectionTableProps> = {}) {
  return render(
    <MemoryRouter>
      <DarCollectionTable {...baseProps} {...overrides} />
    </MemoryRouter>,
  )
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
}

beforeEach(() => {
  vi.clearAllMocks()
  setViewportWidth(1600)
})

afterEach(() => {
  setViewportWidth(1024)
})

describe('DarCollectionTable', () => {
  it('renders the simple table', () => {
    renderTable()
    expect(screen.getByTestId('simple-table')).toBeInTheDocument()
  })

  it('renders a single column header when one column is specified', () => {
    renderTable({ columns: [DarCollectionTableColumnOptions.DAR_CODE] })
    expect(document.querySelectorAll('.column-header')).toHaveLength(1)
  })

  it('renders multiple column headers when multiple columns are specified', () => {
    renderTable({
      columns: [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.DATASET_COUNT,
      ],
    })
    expect(document.querySelectorAll('.column-header')).toHaveLength(2)
  })

  it('shows loading placeholder when isLoading is true', () => {
    renderTable({ isLoading: true })
    expect(document.querySelector('.table-loading-placeholder')).toBeInTheDocument()
  })

  it('does not show loading placeholder when isLoading is false', () => {
    renderTable({ isLoading: false })
    expect(document.querySelector('.table-loading-placeholder')).not.toBeInTheDocument()
  })

  it('renders the confirmation modal', () => {
    renderTable()
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
  })

  it('renders with no collections without crashing', () => {
    renderTable({ collections: [] })
    expect(screen.getByTestId('simple-table')).toBeInTheDocument()
  })

  it('renders with null cancelCollection and reviseCollection', () => {
    renderTable({ cancelCollection: null, reviseCollection: null })
    expect(screen.getByTestId('simple-table')).toBeInTheDocument()
  })

  it('renders column header labels', () => {
    const allColumns = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.NAME,
      DarCollectionTableColumnOptions.SUBMISSION_DATE,
      DarCollectionTableColumnOptions.DATASET_COUNT,
      DarCollectionTableColumnOptions.EXPIRES_AT,
      DarCollectionTableColumnOptions.STATUS,
      DarCollectionTableColumnOptions.ACTIONS,
    ]
    renderTable({ columns: allColumns, consoleType: consoleTypes.RESEARCHER })
    const headers = document.querySelectorAll('.column-header')
    expect(headers.length).toBeGreaterThanOrEqual(5)
    expect(screen.getByText('DAR Code')).toBeInTheDocument()
  })

  it('does not render Dataset Count header when excluded from columns', () => {
    const columnsWithoutDatasetCount = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.NAME,
      DarCollectionTableColumnOptions.SUBMISSION_DATE,
      DarCollectionTableColumnOptions.STATUS,
      DarCollectionTableColumnOptions.ACTIONS,
    ]
    renderTable({ columns: columnsWithoutDatasetCount, consoleType: consoleTypes.RESEARCHER })
    expect(screen.queryByText('Datasets')).not.toBeInTheDocument()
    expect(screen.getByText('DAR Code')).toBeInTheDocument()
  })

  it('renders essential column labels', () => {
    const essentialColumns = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.NAME,
      DarCollectionTableColumnOptions.STATUS,
      DarCollectionTableColumnOptions.ACTIONS,
    ]
    renderTable({ columns: essentialColumns, consoleType: consoleTypes.RESEARCHER })
    expect(screen.getByText('DAR Code')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.queryByText('Datasets')).not.toBeInTheDocument()
  })
})

describe('DarCollectionTable - dataset expansion', () => {
  beforeEach(() => {
    // Make recalculateVisibleTable synchronously populate the visible list so rows render
    vi.mocked(recalculateVisibleTable).mockImplementation(
      ((args: RecalcParams) => {
        if (args.filteredList?.length) args.setVisibleList(args.filteredList)
        return Promise.resolve()
      }) as typeof recalculateVisibleTable,
    )
    vi.mocked(Collections.getCollectionById).mockResolvedValue(
      { darCollectionId: 211 } as unknown as DarCollection,
    )
  })

  afterEach(() => {
    vi.mocked(recalculateVisibleTable).mockReset()
  })

  it('renders DarDatasetTable when a row is expanded', async () => {
    renderTable({
      collections: [baseCollection],
      columns: [DarCollectionTableColumnOptions.DAR_CODE],
      consoleType: consoleTypes.SIGNING_OFFICIAL,
    })

    await userEvent.click(screen.getByRole('button', { name: 'expand' }))

    expect(await screen.findByTestId('dar-dataset-table')).toBeInTheDocument()
  })

  it('calls Collections.getCollectionById with the correct id when expanded', async () => {
    renderTable({
      collections: [baseCollection],
      columns: [DarCollectionTableColumnOptions.DAR_CODE],
      consoleType: consoleTypes.SIGNING_OFFICIAL,
    })

    await userEvent.click(screen.getByRole('button', { name: 'expand' }))
    await screen.findByTestId('dar-dataset-table')

    expect(Collections.getCollectionById).toHaveBeenCalledWith(211)
  })

  it('does not render DarDatasetTable before expansion', () => {
    renderTable({
      collections: [baseCollection],
      columns: [DarCollectionTableColumnOptions.DAR_CODE],
      consoleType: consoleTypes.SIGNING_OFFICIAL,
    })

    expect(screen.queryByTestId('dar-dataset-table')).not.toBeInTheDocument()
  })

  it('does not render expand button for draft collections', () => {
    const draftCollection = { ...baseCollection, status: 'Draft' }
    renderTable({
      collections: [draftCollection],
      columns: [DarCollectionTableColumnOptions.DAR_CODE],
    })

    expect(screen.queryByRole('button', { name: 'expand' })).not.toBeInTheDocument()
  })
})

describe('useResponsiveDarCollectionColumns', () => {
  describe('Console Type Column Configuration', () => {
    it('returns columns including dacNames and darCode but not actions for ADMIN', () => {
      setViewportWidth(1600)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.ADMIN))
      expect(result.current).toContain('dacNames')
      expect(result.current).toContain('darCode')
      expect(result.current).not.toContain('actions')
    })

    it('returns columns including darCode and actions but not dacNames for RESEARCHER', () => {
      setViewportWidth(1600)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.RESEARCHER))
      expect(result.current).toContain('darCode')
      expect(result.current).toContain('actions')
      expect(result.current).not.toContain('dacNames')
    })
  })

  describe('Responsive Breakpoint Behavior', () => {
    it('hides datasetCount below 1450px for ADMIN', () => {
      setViewportWidth(1500)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.ADMIN))
      expect(result.current).toContain('datasetCount')

      act(() => {
        setViewportWidth(1400)
        window.dispatchEvent(new Event('resize'))
      })
      expect(result.current).not.toContain('datasetCount')
    })

    it('shows datasetCount at or above 1450px for ADMIN', () => {
      setViewportWidth(1450)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.ADMIN))
      expect(result.current).toContain('datasetCount')
    })

    it('hides expiresAt below 1250px for ADMIN', () => {
      setViewportWidth(1300)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.ADMIN))
      expect(result.current).toContain('expiresAt')

      act(() => {
        setViewportWidth(1200)
        window.dispatchEvent(new Event('resize'))
      })
      expect(result.current).not.toContain('expiresAt')
    })

    it('hides datasetCount below 1200px for RESEARCHER', () => {
      setViewportWidth(1300)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.RESEARCHER))
      expect(result.current).toContain('datasetCount')

      act(() => {
        setViewportWidth(1100)
        window.dispatchEvent(new Event('resize'))
      })
      expect(result.current).not.toContain('datasetCount')
    })

    it('updates columns when viewport is restored above breakpoint', () => {
      setViewportWidth(1400)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.ADMIN))
      expect(result.current).not.toContain('datasetCount')

      act(() => {
        setViewportWidth(1500)
        window.dispatchEvent(new Event('resize'))
      })
      expect(result.current).toContain('datasetCount')
    })
  })
})
