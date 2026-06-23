import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SigningOfficialDarRequests from 'src/pages/signing_official_console/SigningOfficialDarRequests'
import { Collections } from 'src/libs/ajax/Collections'
import { USER_ROLES } from 'src/libs/utils'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { DarCollection, DarCollectionSummary } from 'src/types/model'

type MockDarCollectionTableProps = {
  collections: DarCollectionSummary[]
  columns: string[]
  isLoading: boolean
  approveCollection: (collection: DarCollectionSummary) => Promise<void>
  consoleType: string
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
  DarCollectionTable: ({ collections, columns, isLoading, approveCollection, consoleType }: MockDarCollectionTableProps) => (
    <div
      data-testid="dar-collection-table"
      data-columns={columns.join(',')}
      data-console-type={consoleType}
      data-loading={isLoading}
    >
      {collections.map(collection => (
        <div key={collection.darCollectionId}>
          <span>{collection.darCode}</span>
          <span>{collection.status}</span>
          {collection.actions.includes('Approve') && (
            <button type="button" onClick={() => approveCollection(collection)}>
              Approve {collection.darCode}
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: {
    approveCollectionById: vi.fn(),
    getCollectionSummariesByRoleName: vi.fn(),
    getCollectionSummaryByRoleNameAndId: vi.fn(),
  },
}))

const collection = (overrides: Partial<DarCollectionSummary> = {}): DarCollectionSummary => {
  const baseCollection: DarCollectionSummary = {
    darCollectionId: 1,
    darCode: 'DAR-1',
    requiresSOApproval: true,
    actions: ['Approve'],
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
  }

  return { ...baseCollection, ...overrides }
}

const collection2 = collection({
  darCollectionId: 2,
  darCode: 'DAR-2',
  name: 'Collection 2',
  researcherName: 'Other Researcher',
  institutionName: 'Other Institution',
  actions: [],
  datasetIds: [2],
  referenceIds: ['reference-id-2'],
  latestReferenceId: 'reference-id-2',
})

describe('SigningOfficialDarRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue([collection(), collection2])
  })

  it('fetches signing official DAR request summaries and renders the table', async () => {
    render(<SigningOfficialDarRequests />)

    await waitFor(() => {
      expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledWith(USER_ROLES.signingOfficial)
    })

    const table = await screen.findByTestId('dar-collection-table')
    expect(table).toHaveAttribute('data-columns', 'darCode,actions')
    expect(table).toHaveAttribute('data-console-type', consoleTypes.SIGNING_OFFICIAL)
    expect(table).toHaveAttribute('data-loading', 'false')
    expect(screen.getByText('DAR-1')).toBeInTheDocument()
    expect(screen.getByText('DAR-2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve DAR-1' })).toBeInTheDocument()
  })

  it('renders a search bar', async () => {
    render(<SigningOfficialDarRequests />)
    await screen.findByTestId('dar-collection-table')
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument()
  })

  it('filters collections by search term', async () => {
    render(<SigningOfficialDarRequests />)
    await screen.findByText('DAR-2')

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'DAR-1' },
    })

    await waitFor(() => {
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.queryByText('DAR-2')).not.toBeInTheDocument()
    })
  })

  it('restores all collections when search is cleared', async () => {
    render(<SigningOfficialDarRequests />)
    await screen.findByText('DAR-2')

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'DAR-1' },
    })
    await waitFor(() => expect(screen.queryByText('DAR-2')).not.toBeInTheDocument())

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: '' },
    })

    await waitFor(() => {
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.getByText('DAR-2')).toBeInTheDocument()
    })
  })

  it('approves a DAR and refreshes the updated row in place', async () => {
    const approvedCollection = collection({
      actions: [],
      requiresSOApproval: false,
      status: 'Approved',
    })
    const approvedDarCollection: DarCollection = {
      id: approvedCollection.darCollectionId,
      darCode: approvedCollection.darCode,
      createDate: approvedCollection.submissionDate,
      createUserId: 1,
      dars: {},
      datasets: [],
    }

    vi.mocked(Collections.approveCollectionById).mockResolvedValue(approvedDarCollection)
    vi.mocked(Collections.getCollectionSummaryByRoleNameAndId).mockResolvedValue(approvedCollection)

    render(<SigningOfficialDarRequests />)

    fireEvent.click(await screen.findByRole('button', { name: 'Approve DAR-1' }))

    await waitFor(() => {
      expect(Collections.approveCollectionById).toHaveBeenCalledWith(1)
      expect(Collections.getCollectionSummaryByRoleNameAndId).toHaveBeenCalledWith({
        id: 1,
        roleName: USER_ROLES.signingOfficial,
      })
    })

    expect(await screen.findByText('Approved')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve DAR-1' })).not.toBeInTheDocument()
    expect(screen.getByText('DAR-1')).toBeInTheDocument()
  })
})
