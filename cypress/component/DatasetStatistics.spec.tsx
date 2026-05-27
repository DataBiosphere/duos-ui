import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DatasetStatistics from 'src/pages/DatasetStatistics'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { DatasetStatisticsDar } from 'src/types/model'

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

const mockEmptyTdrResponse = {
  filteredTotal: 0,
  total: 0,
  items: [],
  roleMap: {} as Record<string, string[]>,
}

const mockTdrResponseWithSnapshot = {
  filteredTotal: 1,
  total: 1,
  items: [
    {
      id: 'snapshot-abc',
      name: 'Snapshot ABC',
      duosId: 'DUOS-000001',
      cloudPlatform: 'gcp' as const,
      resourceLocks: {},
    },
  ],
  roleMap: { 'snapshot-abc': ['reader'] },
}

const mockTdrResponseWithMultipleSnapshots = {
  filteredTotal: 2,
  total: 2,
  items: [
    {
      id: 'snapshot-abc',
      name: 'Snapshot ABC',
      duosId: 'DUOS-000001',
      cloudPlatform: 'gcp' as const,
      resourceLocks: {},
    },
    {
      id: 'snapshot-xyz',
      name: 'Snapshot XYZ',
      duosId: 'DUOS-000001',
      cloudPlatform: 'gcp' as const,
      resourceLocks: {},
    },
  ],
  roleMap: { 'snapshot-abc': ['reader'], 'snapshot-xyz': ['steward'] },
}

const mockTdrResponseWithoutRole = {
  filteredTotal: 1,
  total: 1,
  items: [
    {
      id: 'snapshot-abc',
      name: 'Snapshot ABC',
      duosId: 'DUOS-000001',
      cloudPlatform: 'gcp' as const,
      resourceLocks: {},
    },
  ],
  roleMap: { 'snapshot-abc': ['discoverer'] },
}

describe('DatasetStatistics', () => {
  let queryClient: QueryClient

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
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockEmptyTdrResponse)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('DUOS-000001 - Test Dataset').should('be.visible')
    cy.contains('Test Study').should('be.visible')
    cy.contains('Dr. Test PI').should('be.visible')
  })

  it('shows Data Location when no exportable snapshots are available', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockEmptyTdrResponse)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Data Location').should('be.visible')
    cy.contains('Export').should('not.exist')
  })

  it('shows export button when TDR returns a snapshot with reader role', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockTdrResponseWithSnapshot)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Data Location').should('be.visible')
    cy.contains('Export').should('be.visible')
    cy.contains('Export').should('have.attr', 'href').and('include', 'snapshot-abc')
  })

  it('shows export button when TDR returns a snapshot with steward role', () => {
    const mockTdrWithSteward = {
      filteredTotal: 1,
      total: 1,
      items: [
        {
          id: 'snapshot-xyz',
          name: 'Snapshot XYZ',
          duosId: 'DUOS-000001',
          cloudPlatform: 'gcp' as const,
          resourceLocks: {},
        },
      ],
      roleMap: { 'snapshot-xyz': ['steward'] },
    }

    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockTdrWithSteward)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Export').should('be.visible')
    cy.contains('Export').should('have.attr', 'href').and('include', 'snapshot-xyz')
  })

  it('does not show export button for snapshots without reader or steward role', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockTdrResponseWithoutRole)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Export').should('not.exist')
    cy.contains('Data Location').should('be.visible')
  })

  it('shows multiple export buttons for multiple snapshots', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockTdrResponseWithMultipleSnapshots)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Export').should('exist')
    cy.get('a[title*="Export to Terra"]').should('have.length', 2)
  })

  it('handles TDR API errors gracefully and shows Data Location', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').rejects(new Error('TDR API unavailable'))

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Export').should('not.exist')
    cy.contains('Data Location').should('be.visible')
  })

  it('displays data access requests for the dataset', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves(mockDarsResponse)
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockEmptyTdrResponse)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Data Access Requests for this dataset').should('be.visible')
    cy.contains('DAR-001').should('be.visible')
    cy.contains('Test Project').should('be.visible')
  })

  it('displays empty message when no data access requests exist', () => {
    cy.stub(DataSet, 'searchDatasetIndex').resolves([mockDatasetTerm])
    cy.stub(DatasetMetrics, 'getDatasetStats').resolves([])
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(mockEmptyTdrResponse)

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dataset/DUOS-000001']}>
          <Routes>
            <Route path="/dataset/:datasetIdentifier" element={<DatasetStatistics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('No Data Access Requests have been created for this dataset.').should('be.visible')
  })
})
