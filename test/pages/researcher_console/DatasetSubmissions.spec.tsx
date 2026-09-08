import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DatasetSubmissions from 'src/pages/researcher_console/DatasetSubmissions'
import { AssetType } from 'src/types/library'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Storage } from 'src/libs/storage'
import { useLibraryPageState } from 'src/hooks/useLibraryPageState'
import { Notifications } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'
import { GridColDef } from '@mui/x-data-grid'

// Capture the delete handler passed from DatasetSubmissions to makeSubmissionColumns
let capturedOnDelete: ((term: { datasetId: number, datasetName: string }) => void) | null = null

vi.mock('src/components/data_library/columns/submissionColumns', () => ({
  makeSubmissionColumns: vi.fn((onDelete: typeof capturedOnDelete) => {
    capturedOnDelete = onDelete
    return [] as GridColDef[]
  }),
}))

// Capture handleTabChange passed to LibraryPageShell so we can invoke it in tests
let capturedHandleTabChange: ((tab: AssetType) => void) | null = null

vi.mock('src/components/data_library/LibraryPageShell', () => ({
  default: ({ header, pageState }: { header: React.ReactNode, pageState: { handleTabChange: (tab: AssetType) => void } }) => {
    capturedHandleTabChange = pageState.handleTabChange
    return <div data-testid="library-shell">{header}</div>
  },
}))

vi.mock('src/hooks/useLibraryPageState', () => ({
  useLibraryPageState: vi.fn(() => ({
    urlState: {
      tab: AssetType.DATASETS,
      query: '',
      page: 0,
      pageSize: 25,
      filters: {},
      hideFilters: false,
    },
    handleSearchChange: vi.fn(),
    handleTabChange: vi.fn(),
    handleFiltersChange: vi.fn(),
    handleClearFilters: vi.fn(),
    handleRemoveExternalFilter: vi.fn(),
    handleSortChange: vi.fn(),
    handleToggleFilters: vi.fn(),
    updateUrlState: vi.fn(),
    data: { items: [], total: 0 },
    isFetching: false,
    error: null,
    isMetadataLoading: false,
    availableFilters: {},
    tabCounts: undefined,
    currentAsset: { label: { singular: 'dataset', plural: 'datasets' } },
    filterSections: [],
    externalFilters: [],
    sortModel: [],
  })),
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: {
    deleteDataset: vi.fn(),
  },
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
  },
}))

const navigateMock = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => navigateMock }
})

const baseUser: DuosUser = {
  userId: 42,
  email: 'test@example.com',
  displayName: 'Test User',
  isDataSubmitter: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  emailPreference: false,
  roles: [],
  createDate: new Date('2024-01-01'),
}

const renderComponent = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <DatasetSubmissions />
    </QueryClientProvider>,
  )
}

describe('DatasetSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnDelete = null
    capturedHandleTabChange = null
    vi.mocked(Storage.getCurrentUser).mockReturnValue(baseUser)
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the page title', () => {
    renderComponent()
    expect(screen.getByText('My Data Submissions')).toBeInTheDocument()
  })

  it('renders the dataset status description', () => {
    renderComponent()
    expect(screen.getByText(/View the status of datasets registered in DUOS/)).toBeInTheDocument()
  })

  it('renders the ADD DATASET button', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: /ADD DATASET/i })).toBeInTheDocument()
  })

  // This page's Submitter/Status/Delete columns live on the Datasets tab, so it must land there.
  it('does not ask for a default tab, leaving the hook on Datasets', () => {
    renderComponent()
    expect(vi.mocked(useLibraryPageState)).toHaveBeenCalledWith(expect.anything())
  })

  it('does not render the Signing Official approval reminder — that is Data Library only', () => {
    renderComponent()
    expect(screen.queryByText(/require Signing Officials to approve/)).not.toBeInTheDocument()
  })

  it('renders controlled access description text', () => {
    renderComponent()
    expect(screen.getByText(/Open Access/)).toBeInTheDocument()
    expect(screen.getByText(/Controlled Access data/)).toBeInTheDocument()
  })

  // ── ADD DATASET button ─────────────────────────────────────────────────────

  it('ADD DATASET button is disabled when user is not a data submitter', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, isDataSubmitter: false })
    renderComponent()
    expect(screen.getByRole('button', { name: /ADD DATASET/i })).toBeDisabled()
  })

  it('ADD DATASET button is enabled when user is a data submitter', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, isDataSubmitter: true })
    renderComponent()
    expect(screen.getByRole('button', { name: /ADD DATASET/i })).not.toBeDisabled()
  })

  it('clicking ADD DATASET navigates to /data_submission_form', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, isDataSubmitter: true })
    renderComponent()
    fireEvent.click(screen.getByRole('button', { name: /ADD DATASET/i }))
    expect(navigateMock).toHaveBeenCalledWith('/data_submission_form')
  })

  // ── UPLOAD TEMPLATE button ─────────────────────────────────────────────────

  it('renders the UPLOAD TEMPLATE button', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: /UPLOAD TEMPLATE/i })).toBeInTheDocument()
  })

  // Deliberately wider than ADD DATASET's data-submitter-only rule: it matches the route's own
  // RoleBAC guard, since chairpersons and admins register studies too.
  it.each([
    ['data submitter', { isDataSubmitter: true }],
    ['chairperson', { isChairPerson: true }],
    ['admin', { isAdmin: true }],
  ])('UPLOAD TEMPLATE button is enabled for a %s', (_role, roleFlags) => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, ...roleFlags })
    renderComponent()
    expect(screen.getByRole('button', { name: /UPLOAD TEMPLATE/i })).not.toBeDisabled()
  })

  it('UPLOAD TEMPLATE button is disabled for a user with none of those roles', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, isResearcher: true })
    renderComponent()
    expect(screen.getByRole('button', { name: /UPLOAD TEMPLATE/i })).toBeDisabled()
  })

  it('clicking UPLOAD TEMPLATE navigates to /data_submission_template', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, isDataSubmitter: true })
    renderComponent()
    fireEvent.click(screen.getByRole('button', { name: /UPLOAD TEMPLATE/i }))
    expect(navigateMock).toHaveBeenCalledWith('/data_submission_template')
  })

  it('leaves the manual ADD DATASET path untouched for a chairperson', () => {
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ ...baseUser, isChairPerson: true })
    renderComponent()
    expect(screen.getByRole('button', { name: /ADD DATASET/i })).toBeDisabled()
  })

  // ── Delete dialog ──────────────────────────────────────────────────────────

  it('delete dialog is not shown on initial render', () => {
    renderComponent()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('delete dialog opens when the delete callback is triggered', () => {
    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 1, datasetName: 'Test Dataset' })
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('delete dialog shows the dataset name in the confirmation prompt', () => {
    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 1, datasetName: 'Test Dataset' })
    })
    expect(screen.getByText(/Are you sure you want to delete the dataset 'Test Dataset'\?/)).toBeInTheDocument()
  })

  it('Cancel button closes the delete dialog', async () => {
    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 1, datasetName: 'Test Dataset' })
    })
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('changing tab while dialog is open closes the dialog', async () => {
    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 1, datasetName: 'Test Dataset' })
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    act(() => {
      capturedHandleTabChange!(AssetType.STUDIES)
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  // ── Delete confirmation ────────────────────────────────────────────────────

  it('confirms delete: calls DataSet.deleteDataset with the correct dataset id', async () => {
    vi.mocked(DataSet.deleteDataset).mockResolvedValue({ status: 200 })
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => undefined)

    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 7, datasetName: 'Dataset Seven' })
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }))

    await waitFor(() => {
      expect(DataSet.deleteDataset).toHaveBeenCalledWith(7)
    })
  })

  it('shows success notification after a successful delete', async () => {
    vi.mocked(DataSet.deleteDataset).mockResolvedValue({ status: 200 })
    const showSuccessSpy = vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => undefined)

    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 1, datasetName: 'Dataset One' })
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }))

    await waitFor(() => {
      expect(showSuccessSpy).toHaveBeenCalledWith({ text: `Removed dataset 'Dataset One' successfully.` })
    })
  })

  it('invalidates both the data grid and the tab-count queries after a successful delete', async () => {
    vi.mocked(DataSet.deleteDataset).mockResolvedValue({ status: 200 })
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => undefined)
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 7, datasetName: 'Dataset Seven' })
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }))

    // libraryConfig.key is `submissions-${userId}`; both the grid rows and the
    // tab-count badges are backed by separate queries and must both refetch so
    // the Datasets badge does not keep showing the stale pre-delete count.
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['library-data', 'submissions-42'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['library-tab-counts', 'submissions-42'] })
    })
  })

  it('closes the dialog after a successful delete', async () => {
    vi.mocked(DataSet.deleteDataset).mockResolvedValue({ status: 200 })
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => undefined)

    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 1, datasetName: 'Test Dataset' })
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows an error notification when delete fails', async () => {
    vi.mocked(DataSet.deleteDataset).mockRejectedValue(new Error('Network error'))
    const showErrorSpy = vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)

    renderComponent()
    act(() => {
      capturedOnDelete!({ datasetId: 3, datasetName: 'Fail Dataset' })
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }))

    await waitFor(() => {
      expect(showErrorSpy).toHaveBeenCalledWith({ text: `Error removing dataset 'Fail Dataset'` })
    })
  })
})
