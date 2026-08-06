import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import DACConsole from 'src/pages/DACConsole'
import { Collections } from 'src/libs/ajax/Collections'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { DarCollectionSummary, DuosUser } from 'src/types/model'
import { renderWithRouter } from '../test-utils'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: {
    getCollectionSummariesByRoleName: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getUserRelevantDatasets: vi.fn(),
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
  },
}))

vi.mock('src/utils/DarCollectionUtils', () => ({
  cancelCollectionFn: vi.fn(() => vi.fn()),
  openCollectionFn: vi.fn(() => vi.fn()),
  updateCollectionFn: vi.fn(() => vi.fn()),
  consoleTypes: { CHAIR: 'chair', MEMBER: 'member', RESEARCHER: 'researcher' },
}))

const consoleTypes = { CHAIR: 'chair', MEMBER: 'member', RESEARCHER: 'researcher' }

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/hooks/useResponsiveDarCollectionColumns', () => ({
  useResponsiveDarCollectionColumns: vi.fn().mockReturnValue(['col1', 'col2']),
}))

vi.mock('src/components/TableHeaderSection', () => ({
  default: ({ title, description }: { title: string, description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) => (
    <input
      aria-label="search"
      onChange={e => handleSearchChange(e.target.value)}
    />
  ),
}))

type MockDarCollectionTableProps = {
  collections: DarCollectionSummary[]
  isLoading: boolean
  consoleType: string
  cancelCollection?: unknown
  openCollection?: unknown
}

vi.mock('src/components/dar_collection_table/DarCollectionTable', () => ({
  DarCollectionTable: ({ collections, isLoading, consoleType, cancelCollection, openCollection }: MockDarCollectionTableProps) => (
    <div
      data-testid="dar-collection-table"
      data-loading={String(isLoading)}
      data-console-type={consoleType}
      data-has-cancel={String(!!cancelCollection)}
      data-has-open={String(!!openCollection)}
    >
      {(collections ?? []).map(c => (
        <span key={c.darCollectionId}>{c.darCode}</span>
      ))}
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

const chairUser = { isChairPerson: true, isMember: false } as DuosUser
const memberUser = { isChairPerson: false, isMember: true } as DuosUser

describe('DACConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useResponsiveDarCollectionColumns).mockReturnValue(['col1', 'col2'])
    vi.mocked(User.getUserRelevantDatasets).mockResolvedValue([])
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([collection1, collection2])
  })

  describe('as a Chairperson', () => {
    beforeEach(() => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(chairUser)
    })

    it('renders the chair title and description', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.getByText('My DAC\'s Data Access Requests')).toBeInTheDocument()
      expect(screen.getByText('Select and manage Data Access Requests for DAC Review')).toBeInTheDocument()
    })

    it('fetches collections scoped to the chairperson role', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledWith(USER_ROLES.chairperson)
    })

    it('renders the table with the CHAIR console type and cancel/open enabled', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      const table = screen.getByTestId('dar-collection-table')
      expect(table).toHaveAttribute('data-console-type', consoleTypes.CHAIR)
      expect(table).toHaveAttribute('data-has-cancel', 'true')
      expect(table).toHaveAttribute('data-has-open', 'true')
    })
  })

  describe('as a Member', () => {
    beforeEach(() => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(memberUser)
    })

    it('renders the member title and description', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.getByText('My DAC\'s Data Access Requests')).toBeInTheDocument()
      expect(screen.getByText('Vote on Data Access Request for DAC Review')).toBeInTheDocument()
    })

    it('fetches collections scoped to the member role', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledWith(USER_ROLES.member)
    })

    it('renders the table with the MEMBER console type and cancel/open disabled', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      const table = screen.getByTestId('dar-collection-table')
      expect(table).toHaveAttribute('data-console-type', consoleTypes.MEMBER)
      expect(table).toHaveAttribute('data-has-cancel', 'false')
      expect(table).toHaveAttribute('data-has-open', 'false')
    })
  })

  describe('shared behavior', () => {
    beforeEach(() => {
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue(memberUser)
    })

    it('fetches relevant datasets alongside collections', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(User.getUserRelevantDatasets).toHaveBeenCalledTimes(1)
    })

    it('passes loaded collections to the table', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.getByText('DAR-2')).toBeInTheDocument()
    })

    it('shows loading state while fetching', () => {
      vi.mocked(Collections.getCollectionSummariesByRoleName).mockReturnValue(new Promise(() => {}))
      renderWithRouter(<DACConsole />)
      expect(screen.getByTestId('dar-collection-table')).toHaveAttribute('data-loading', 'true')
    })

    it('clears loading state after fetch completes', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.getByTestId('dar-collection-table')).toHaveAttribute('data-loading', 'false')
    })

    it('shows an error notification when fetch fails', async () => {
      vi.mocked(Collections.getCollectionSummariesByRoleName).mockRejectedValue(new Error('network error'))
      await act(async () => renderWithRouter(<DACConsole />))
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error initializing Collections table',
      })
    })

    it('does not render the table when no responsive columns are available', async () => {
      vi.mocked(useResponsiveDarCollectionColumns).mockReturnValue([])
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.queryByTestId('dar-collection-table')).not.toBeInTheDocument()
    })

    it('renders the search bar', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.getByRole('textbox', { name: 'search' })).toBeInTheDocument()
    })

    it('filters collections when the search input changes', async () => {
      await act(async () => renderWithRouter(<DACConsole />))
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.getByText('DAR-2')).toBeInTheDocument()
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: 'search' }), { target: { value: 'DAR-1' } })
      })
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.queryByText('DAR-2')).not.toBeInTheDocument()
    })
  })
})
