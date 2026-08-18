import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { DarCollectionTable, DarCollectionTableProps } from 'src/components/dar_collection_table/DarCollectionTable'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'
import { Storage } from 'src/libs/storage'
import { DarCollectionSummary } from 'src/types/model'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'

const useDarCollectionDataUseBucketsMock = vi.fn().mockReturnValue({})

vi.mock('src/components/dar_collection_table/useDarCollectionDataUseBuckets', () => ({
  useDarCollectionDataUseBuckets: (...args: unknown[]) => useDarCollectionDataUseBucketsMock(...args),
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUserSettings: vi.fn().mockReturnValue(null),
    setCurrentUserSettings: vi.fn(),
    getCurrentUser: vi.fn().mockReturnValue({ userId: 1, roles: [] }),
  },
}))

vi.mock('src/components/dar_collection_table/CollectionConfirmationModal', () => ({
  default: () => <div data-testid="confirmation-modal" />,
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
    <div style={{ width: 1200, height: 600 }}>
      <MemoryRouter>
        <DarCollectionTable {...baseProps} {...overrides} />
      </MemoryRouter>
    </div>,
  )
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
}

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Storage.getCurrentUserSettings).mockReturnValue(null)
  vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 1, roles: [] } as never)
  useDarCollectionDataUseBucketsMock.mockReturnValue({})
  setViewportWidth(1600)
})

describe('DarCollectionTable', () => {
  it('renders the data grid', () => {
    const { container } = renderTable()
    expect(container.querySelector('.MuiDataGrid-root')).toBeInTheDocument()
  })

  it('renders a single column header when one column is specified', () => {
    renderTable({ columns: [DarCollectionTableColumnOptions.DAR_CODE] })
    expect(document.querySelectorAll('.MuiDataGrid-columnHeader')).toHaveLength(1)
  })

  it('renders multiple column headers when multiple columns are specified', () => {
    renderTable({
      columns: [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.DATASET_COUNT,
      ],
    })
    expect(document.querySelectorAll('.MuiDataGrid-columnHeader')).toHaveLength(2)
  })

  it('shows a loading indicator when isLoading is true', () => {
    const { container } = renderTable({ isLoading: true })
    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })

  it('does not show a loading indicator when isLoading is false', () => {
    const { container } = renderTable({ isLoading: false })
    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument()
  })

  it('renders the confirmation modal', () => {
    renderTable()
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
  })

  it('renders with no collections without crashing', () => {
    const { container } = renderTable({ collections: [] })
    expect(container.querySelector('.MuiDataGrid-root')).toBeInTheDocument()
  })

  it('renders with null cancelCollection and reviseCollection', () => {
    const { container } = renderTable({ cancelCollection: null, reviseCollection: null })
    expect(container.querySelector('.MuiDataGrid-root')).toBeInTheDocument()
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
    const headers = document.querySelectorAll('.MuiDataGrid-columnHeader')
    expect(headers.length).toBeGreaterThanOrEqual(5)
    expect(screen.getByText('DAR Code')).toBeInTheDocument()
  })

  it('does not render a Datasets header when datasetCount is excluded from columns', () => {
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

  it('renders a Data Use header when included, without an expand toggle', () => {
    renderTable({ columns: [DarCollectionTableColumnOptions.DAR_CODE, DarCollectionTableColumnOptions.DATA_USE] })
    expect(screen.getByText('Data Use')).toBeInTheDocument()
    expect(document.querySelector('[id="211_dropdown"]')).toBeNull()
  })

  it('renders one row per data-use group for a collection with multiple groups', () => {
    useDarCollectionDataUseBucketsMock.mockReturnValue({
      211: {
        status: 'loaded',
        buckets: [
          { key: 'bucket-1', label: 'GRU', datasets: [], datasetIds: [], elections: [], votes: [] },
          { key: 'bucket-2', label: 'NPU', datasets: [], datasetIds: [], elections: [], votes: [] },
        ],
      },
    })
    const { container } = renderTable({
      columns: [DarCollectionTableColumnOptions.DAR_CODE, DarCollectionTableColumnOptions.DATA_USE],
    })
    expect(container.querySelectorAll('.MuiDataGrid-row')).toHaveLength(2)
    expect(screen.getByText('GRU')).toBeInTheDocument()
    expect(screen.getByText('NPU')).toBeInTheDocument()
    // The DAR code column is row-spanned across both groups, so it renders once, not twice.
    expect(screen.getAllByText('DAR-259')).toHaveLength(1)
  })

  it('requests data-use buckets for the collection ids on the current page', () => {
    const secondCollection = { ...baseCollection, darCollectionId: 212 }
    renderTable({
      collections: [baseCollection, secondCollection],
      columns: [DarCollectionTableColumnOptions.DAR_CODE, DarCollectionTableColumnOptions.DATA_USE],
      consoleType: consoleTypes.CHAIR,
    })
    expect(useDarCollectionDataUseBucketsMock).toHaveBeenCalledWith([211, 212], false)
  })

  it('passes isUnfilteredView=true for admin/researcher/signing official consoles', () => {
    renderTable({
      columns: [DarCollectionTableColumnOptions.DAR_CODE, DarCollectionTableColumnOptions.DATA_USE],
      consoleType: consoleTypes.ADMIN,
    })
    expect(useDarCollectionDataUseBucketsMock).toHaveBeenCalledWith([211], true)
  })

  it('reads the persisted sort field/direction on mount', () => {
    vi.mocked(Storage.getCurrentUserSettings).mockReturnValue({ field: 'darCode', dir: 1 })
    renderTable({ columns: [DarCollectionTableColumnOptions.DAR_CODE] })
    expect(Storage.getCurrentUserSettings).toHaveBeenCalledWith('storageDarCollectionSort')
  })

  it('persists sort field/direction when a column header is clicked', async () => {
    const user = userEvent.setup()
    renderTable({ columns: [DarCollectionTableColumnOptions.DAR_CODE] })

    await user.click(screen.getByText('DAR Code'))

    expect(Storage.setCurrentUserSettings).toHaveBeenCalledWith(
      'storageDarCollectionSort',
      expect.objectContaining({ field: 'darCode' }),
    )
  })
})

describe('useResponsiveDarCollectionColumns', () => {
  afterEach(() => {
    setViewportWidth(1024)
  })

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

    it('includes dataUse by default at wide viewports', () => {
      setViewportWidth(1800)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.CHAIR))
      expect(result.current).toContain('dataUse')
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

    it('hides dataUse below 1650px for ADMIN', () => {
      setViewportWidth(1700)
      const { result } = renderHook(() => useResponsiveDarCollectionColumns(consoleTypes.ADMIN))
      expect(result.current).toContain('dataUse')

      act(() => {
        setViewportWidth(1600)
        window.dispatchEvent(new Event('resize'))
      })
      expect(result.current).not.toContain('dataUse')
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
