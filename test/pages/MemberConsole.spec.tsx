import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MemberConsole from 'src/pages/MemberConsole'
import { Collections } from 'src/libs/ajax/Collections'
import { USER_ROLES } from 'src/libs/utils'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { DarCollectionSummary } from 'src/types/model'
import { renderWithRouter } from '../test-utils'

type MockDarCollectionTableProps = {
  collections: DarCollectionSummary[]
  columns: string[]
  isLoading: boolean
  consoleType: string
  goToVote: (collectionId: number) => void
}

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (value: string) => void }) => (
    <input
      type="text"
      aria-label="search"
      onChange={e => handleSearchChange(e.target.value)}
    />
  ),
}))

vi.mock('src/hooks/useResponsiveDarCollectionColumns', () => ({
  useResponsiveDarCollectionColumns: vi.fn(() => ['darCode', 'actions']),
}))

vi.mock('src/components/dar_collection_table/DarCollectionTable', () => ({
  DarCollectionTable: ({ collections, columns, isLoading, consoleType, goToVote }: MockDarCollectionTableProps) => (
    <div
      data-testid="dar-collection-table"
      data-columns={columns.join(',')}
      data-console-type={consoleType}
      data-loading={isLoading}
    >
      {collections.map(c => (
        <div key={c.darCollectionId}>
          <span>{c.darCode}</span>
          <button type="button" onClick={() => goToVote(c.darCollectionId)}>
            Vote {c.darCode}
          </button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: {
    getCollectionSummariesByRoleName: vi.fn(),
  },
}))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

const makeCollection = (overrides: Partial<DarCollectionSummary> = {}): DarCollectionSummary => ({
  darCollectionId: 1,
  darCode: 'DAR-1',
  requiresSOApproval: false,
  actions: [],
  name: 'Collection 1',
  datasetCount: 1,
  status: 'Open',
  submissionDate: 1640995200000,
  researcherName: 'Researcher',
  institutionName: 'Institution',
  dacNames: ['DAC1'],
  dacCode: 'DAC1',
  datasetIds: [1],
  expired: false,
  expiresAt: 1672531200000,
  latestReferenceId: 'reference-id-1',
  progressReport: false,
  referenceIds: ['reference-id-1'],
  ...overrides,
})

const collection1 = makeCollection()
const collection2 = makeCollection({
  darCollectionId: 2,
  darCode: 'DAR-2',
  name: 'Collection 2',
  researcherName: 'Other Researcher',
  datasetIds: [2],
  referenceIds: ['reference-id-2'],
  latestReferenceId: 'reference-id-2',
})

describe('MemberConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([collection1, collection2])
  })

  it('renders the page title and description', async () => {
    renderWithRouter(<MemberConsole />)
    await screen.findByTestId('dar-collection-table')
    expect(screen.getByText('My DAC\'s Data Access Requests')).toBeInTheDocument()
    expect(screen.getByText('Vote on Data Access Request for DAC Review')).toBeInTheDocument()
  })

  it('fetches member collections and renders the table', async () => {
    renderWithRouter(<MemberConsole />)

    await waitFor(() => {
      expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledWith(USER_ROLES.member)
    })

    const table = await screen.findByTestId('dar-collection-table')
    expect(table).toHaveAttribute('data-columns', 'darCode,actions')
    expect(table).toHaveAttribute('data-console-type', consoleTypes.MEMBER)
    expect(table).toHaveAttribute('data-loading', 'false')
    expect(screen.getByText('DAR-1')).toBeInTheDocument()
    expect(screen.getByText('DAR-2')).toBeInTheDocument()
  })

  it('renders a search bar', async () => {
    renderWithRouter(<MemberConsole />)
    await screen.findByTestId('dar-collection-table')
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument()
  })

  it('filters collections by search term', async () => {
    renderWithRouter(<MemberConsole />)
    await screen.findByText('DAR-2')

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'DAR-1' },
    })

    await waitFor(() => {
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.queryByText('DAR-2')).not.toBeInTheDocument()
    })
  })

  it('shows an error notification when fetching fails', async () => {
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockRejectedValue(new Error('Network error'))
    const { Notifications } = await import('src/libs/utils')
    vi.spyOn(Notifications, 'showError')

    renderWithRouter(<MemberConsole />)

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error initializing Collections table',
      })
    })
  })
})
