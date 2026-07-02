import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AdminManageDarCollections from 'src/pages/AdminManageDarCollections'
import { Collections } from 'src/libs/ajax/Collections'
import { Notifications } from 'src/libs/utils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { DarCollectionSummary } from 'src/types/model'

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: {
    getCollectionSummariesByRoleName: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
    getSearchFilterFunctions: () => ({
      darCollections: (term: string, list: DarCollectionSummary[]) =>
        list.filter(c => c.darCode.toLowerCase().includes(term.toLowerCase())),
    }),
  }
})

vi.mock('src/libs/theme', () => ({
  Styles: {
    PAGE: {},
    SEARCH_ACTION_HEADER_SECTION: {},
    TABLE: { HEADER_ROW: {} },
  },
}))

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/hooks/useResponsiveDarCollectionColumns', () => ({
  useResponsiveDarCollectionColumns: vi.fn().mockReturnValue(['col1', 'col2']),
}))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) =>
    React.createElement('div', null,
      React.createElement('h1', null, title),
      React.createElement('p', null, description)),
}))

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) =>
    React.createElement('input', {
      'aria-label': 'search',
      'onChange': (e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value),
    }),
}))

vi.mock('src/components/dar_collection_table/DarCollectionTable', () => ({
  DarCollectionTable: ({ collections, isLoading }: { collections: DarCollectionSummary[], isLoading: boolean }) =>
    React.createElement(
      'div',
      { 'data-testid': 'dar-collection-table', 'data-loading': String(isLoading) },
      (collections ?? []).map(c =>
        React.createElement('span', { key: c.darCollectionId }, c.darCode),
      ),
    ),
}))

vi.mock('src/utils/DarCollectionUtils', async (importActual) => {
  const actual = await importActual<typeof import('src/utils/DarCollectionUtils')>()
  return {
    ...actual,
    cancelCollectionFn: vi.fn(() => vi.fn()),
    openCollectionFn: vi.fn(() => vi.fn()),
    updateCollectionFn: vi.fn(() => vi.fn()),
  }
})

const makeCollection = (id: number, darCode: string): DarCollectionSummary => ({
  darCollectionId: id,
  darCode,
  actions: [],
  dacNames: [],
  dacCode: 'DAC-1',
  datasetCount: 0,
  datasetIds: [],
  expired: false,
  expiresAt: 0,
  institutionName: 'Test Institution',
  latestReferenceId: `ref-${id}`,
  name: `Collection ${id}`,
  progressReport: false,
  referenceIds: [],
  requiresSOApproval: false,
  researcherName: 'Test Researcher',
  status: 'In Progress',
  submissionDate: 0,
})

const testCollections = [
  makeCollection(1, 'DAR-001'),
  makeCollection(2, 'DAR-002'),
]

describe('AdminManageDarCollections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useResponsiveDarCollectionColumns).mockReturnValue(['col1', 'col2'])
  })

  it('renders the page title', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.getByText('All Data Access Requests')).toBeInTheDocument()
  })

  it('renders the description', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.getByText('List of all Data Access Requests saved in DUOS')).toBeInTheDocument()
  })

  it('fetches collections on mount', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<AdminManageDarCollections />))
    expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledTimes(1)
  })

  it('passes loaded collections to the table', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue(testCollections)
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.getByText('DAR-001')).toBeInTheDocument()
    expect(screen.getByText('DAR-002')).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockReturnValue(new Promise(() => {}))
    render(<AdminManageDarCollections />)
    expect(screen.getByTestId('dar-collection-table')).toHaveAttribute('data-loading', 'true')
  })

  it('clears loading state after fetch completes', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.getByTestId('dar-collection-table')).toHaveAttribute('data-loading', 'false')
  })

  it('shows an error notification when fetch fails', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockRejectedValue(new Error('network error'))
    await act(async () => render(<AdminManageDarCollections />))
    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error initializing Collections table',
    })
  })

  it('does not render the table when no responsive columns are available', async () => {
    vi.mocked(useResponsiveDarCollectionColumns).mockReturnValue([])
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue(testCollections)
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.queryByTestId('dar-collection-table')).not.toBeInTheDocument()
  })

  it('renders the search bar', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([])
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.getByRole('textbox', { name: 'search' })).toBeInTheDocument()
  })

  it('filters collections when the search input changes', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue(testCollections)
    await act(async () => render(<AdminManageDarCollections />))
    expect(screen.getByText('DAR-001')).toBeInTheDocument()
    expect(screen.getByText('DAR-002')).toBeInTheDocument()
    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: 'search' }), { target: { value: 'DAR-001' } })
    })
    expect(screen.getByText('DAR-001')).toBeInTheDocument()
    expect(screen.queryByText('DAR-002')).not.toBeInTheDocument()
  })
})
