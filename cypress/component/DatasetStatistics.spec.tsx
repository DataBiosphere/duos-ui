import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DatasetStatistics from 'src/pages/DatasetStatistics'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { DatasetStatisticsDar } from 'src/types/model'
import { SnapshotSummaryModel } from 'src/types/tdrModel'

const mockDatasetTerm = {
  datasetId: 1,
  datasetIdentifier: 'DUOS-000001',
  datasetName: 'Test Dataset',
  accessManagement: 'controlled',
  dataLocation: 'TDR Location',
  url: 'https://example.com/dataset',
  study: {
    studyId: 101,
    studyName: 'Test Study',
    description: 'A test study',
    phenotype: 'Genomic',
    piName: 'Dr. Test PI',
    dataCustodianEmail: ['custodian@example.com'],
  },
  participantCount: 100,
}

const mockDarsResponse: DatasetStatisticsDar[] = [
  {
    darCode: 'DAR-001',
    projectTitle: 'Test Project',
    updateDate: new Date('2026-04-30').getTime(),
    expired: false,
    nonTechRus: 'A test data access request',
    referenceId: '12345',
  },
]

const buildSnapshot = (id: string, name: string): SnapshotSummaryModel => ({
  id,
  name,
  duosId: 'DUOS-000001',
  cloudPlatform: 'gcp',
  resourceLocks: {},
})

const buildTdrResponse = (
  items: SnapshotSummaryModel[],
  roleMap: Record<string, string[]>,
) => ({
  filteredTotal: items.length,
  total: items.length,
  items,
  roleMap,
})

const mockEmptyTdrResponse = buildTdrResponse([], {})

const mockTdrResponseWithSnapshot = buildTdrResponse(
  [buildSnapshot('snapshot-abc', 'Snapshot ABC')],
  { 'snapshot-abc': ['reader'] },
)

const mockTdrResponseWithStewardSnapshot = buildTdrResponse(
  [buildSnapshot('snapshot-xyz', 'Snapshot XYZ')],
  { 'snapshot-xyz': ['steward'] },
)

const mockTdrResponseWithMultipleSnapshots = buildTdrResponse(
  [buildSnapshot('snapshot-abc', 'Snapshot ABC'), buildSnapshot('snapshot-xyz', 'Snapshot XYZ')],
  { 'snapshot-abc': ['reader'], 'snapshot-xyz': ['steward'] },
)

const mockTdrResponseWithoutRole = buildTdrResponse(
  [buildSnapshot('snapshot-abc', 'Snapshot ABC')],
  { 'snapshot-abc': ['discoverer'] },
)

describe('DatasetStatistics', () => {
  let queryClient: QueryClient

  const mountDatasetStatistics = ({
    dars = mockDarsResponse,
    tdrResponse = mockEmptyTdrResponse,
    tdrError,
  }: {
    dars?: DatasetStatisticsDar[]
    tdrResponse?: ReturnType<typeof buildTdrResponse>
    tdrError?: Error
  } = {}) => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(dars)

    if (tdrError) {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').rejects(tdrError)
    }
    else {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(tdrResponse)
    }

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    cy.initApplicationConfig()
  })

  it('renders the dataset details page', () => {
    mountDatasetStatistics()

    cy.contains('DUOS-000001 - Test Dataset').should('be.visible')
    cy.contains('Test Study').should('be.visible')
    cy.contains('Dr. Test PI').should('be.visible')
  })

  it('shows Data Location when no exportable snapshots are available', () => {
    mountDatasetStatistics()

    cy.contains('Data Location').should('be.visible')
    cy.contains('TDR Location').should('be.visible')
    cy.contains('Export').should('not.exist')
  })

  it('shows export button when TDR returns a snapshot with reader role', () => {
    mountDatasetStatistics({ tdrResponse: mockTdrResponseWithSnapshot })

    cy.contains('Data Location').should('be.visible')
    cy.contains('TDR Location').should('be.visible')
    cy.contains('Export').should('be.visible')
    cy.contains('Export').should('have.attr', 'href').and('include', 'snapshot-abc')
  })

  it('shows export button when TDR returns a snapshot with steward role', () => {
    mountDatasetStatistics({ tdrResponse: mockTdrResponseWithStewardSnapshot })

    cy.contains('TDR Location').should('be.visible')
    cy.contains('Export').should('be.visible')
    cy.contains('Export').should('have.attr', 'href').and('include', 'snapshot-xyz')
  })

  it('does not show export button for snapshots without reader or steward role', () => {
    mountDatasetStatistics({ tdrResponse: mockTdrResponseWithoutRole })

    cy.contains('Export').should('not.exist')
    cy.contains('Data Location').should('be.visible')
    cy.contains('TDR Location').should('be.visible')
  })

  it('shows multiple export buttons for multiple snapshots', () => {
    mountDatasetStatistics({ tdrResponse: mockTdrResponseWithMultipleSnapshots })

    cy.contains('TDR Location').should('be.visible')
    cy.contains('Export').should('exist')
    cy.get('a[title*="Export snapshot"]').should('have.length', 2)
  })

  it('handles TDR API errors gracefully and shows Data Location', () => {
    mountDatasetStatistics({ tdrError: new Error('TDR API unavailable') })

    cy.contains('Export').should('not.exist')
    cy.contains('Data Location').should('be.visible')
    cy.contains('TDR Location').should('be.visible')
  })

  it('displays data access requests for the dataset', () => {
    mountDatasetStatistics()

    cy.contains('Data Access Requests for this dataset').should('be.visible')
    cy.contains('DAR-001').should('be.visible')
    cy.contains('Test Project').should('be.visible')
  })

  it('displays empty message when no data access requests exist', () => {
    mountDatasetStatistics({ dars: [] })

    cy.contains('No Data Access Requests have been created for this dataset.').should('be.visible')
  })
})
