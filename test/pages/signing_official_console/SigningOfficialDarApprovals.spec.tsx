import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SigningOfficialDarApprovals from 'src/pages/signing_official_console/SigningOfficialDarApprovals'
import { Collections } from 'src/libs/ajax/Collections'
import { USER_ROLES } from 'src/libs/utils'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { DarCollectionSummary } from 'src/types/model'
import { PI_QUALIFICATION } from 'src/libs/principalInvestigator'

type MockDarCollectionTableProps = {
  collections: DarCollectionSummary[]
  columns: string[]
  isLoading: boolean
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
  DarCollectionTable: ({ collections, columns, isLoading, consoleType }: MockDarCollectionTableProps) => (
    <div
      data-testid="dar-collection-table"
      data-columns={columns.join(',')}
      data-console-type={consoleType}
      data-loading={isLoading}
    >
      {collections.map(collection => (
        <div key={collection.darCollectionId}>
          <span>{collection.darCode}</span>
          {collection.actions.includes('Approve') && (
            <button id={`${consoleType}-approve-${collection.darCollectionId}`} type="button">
              Approve
            </button>
          )}
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

const collection = (overrides: Partial<DarCollectionSummary> = {}): DarCollectionSummary => {
  const baseCollection: DarCollectionSummary = {
    actions: [],
    dacNames: ['DAC1'],
    dacCode: 'DAC1',
    darCode: 'DAR-1',
    darCollectionId: 1,
    datasetCount: 1,
    datasetIds: [1],
    expired: false,
    expiresAt: 1672531200000,
    institutionName: 'Institution',
    latestReferenceId: 'reference-id-1',
    name: 'Collection 1',
    progressReport: false,
    referenceIds: ['reference-id-1'],
    requiresSOApproval: true,
    researcherName: 'Researcher',
    status: 'Open',
    submissionDate: 1640995200000,
  }

  return { ...baseCollection, ...overrides }
}

const mockCollectionList = [
  collection(),
  collection({
    darCollectionId: 2,
    darCode: 'DAR-2',
    requiresSOApproval: false,
    datasetIds: [2],
    referenceIds: ['reference-id-2'],
    latestReferenceId: 'reference-id-2',
  }),
  collection({
    darCollectionId: 3,
    darCode: 'DAR-3',
    actions: ['Approve'],
    datasetIds: [3],
    referenceIds: ['reference-id-3'],
    latestReferenceId: 'reference-id-3',
  }),
]

describe('SigningOfficialDarApprovals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Collections.getCollectionSummariesByRoleName).mockResolvedValue(mockCollectionList)
  })

  it('renders and filters collections requiring approval', async () => {
    render(<SigningOfficialDarApprovals />)

    expect(screen.getByText('My Institution\'s Data Access Approvals')).toBeInTheDocument()
    expect(screen.getByText(PI_QUALIFICATION, { exact: false })).toBeInTheDocument()

    await waitFor(() => {
      expect(Collections.getCollectionSummariesByRoleName).toHaveBeenCalledWith(USER_ROLES.signingOfficial)
    })

    const table = await screen.findByTestId('dar-collection-table')
    expect(table).toHaveAttribute('data-columns', 'darCode,actions')
    expect(table).toHaveAttribute('data-console-type', consoleTypes.SIGNING_OFFICIAL)
    expect(table).toHaveAttribute('data-loading', 'false')
    expect(screen.getByText('DAR-1')).toBeInTheDocument()
    expect(screen.queryByText('DAR-2')).not.toBeInTheDocument()
    expect(screen.getByText('DAR-3')).toBeInTheDocument()
  })

  it('renders the Approve button for collections requiring approval with an approve action', async () => {
    render(<SigningOfficialDarApprovals />)

    await screen.findByText('DAR-3')

    expect(document.querySelector('#signingOfficial-approve-1')).not.toBeInTheDocument()
    expect(document.querySelector('#signingOfficial-approve-2')).not.toBeInTheDocument()
    expect(document.querySelector('#signingOfficial-approve-3')).toBeInTheDocument()
    expect(document.querySelector('#signingOfficial-approve-3')).toHaveTextContent('Approve')
  })

  it('renders a search bar', async () => {
    render(<SigningOfficialDarApprovals />)
    await screen.findByTestId('dar-collection-table')
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument()
  })

  it('filters the approval list by search term', async () => {
    render(<SigningOfficialDarApprovals />)
    // DAR-1 and DAR-3 pass the requiresSOApproval filter; DAR-2 is already excluded
    await screen.findByText('DAR-3')

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'DAR-1' },
    })

    await waitFor(() => {
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.queryByText('DAR-3')).not.toBeInTheDocument()
    })
  })

  it('restores the approval list when search is cleared', async () => {
    render(<SigningOfficialDarApprovals />)
    await screen.findByText('DAR-3')

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'DAR-1' },
    })
    await waitFor(() => expect(screen.queryByText('DAR-3')).not.toBeInTheDocument())

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: '' },
    })

    await waitFor(() => {
      expect(screen.getByText('DAR-1')).toBeInTheDocument()
      expect(screen.getByText('DAR-3')).toBeInTheDocument()
    })
  })
})
