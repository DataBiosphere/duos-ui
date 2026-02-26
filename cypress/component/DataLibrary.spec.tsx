import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataLibrary } from 'src/pages/DataLibrary'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'

const mockMetadataResponse = {
  aggregations: {
    dac: { buckets: [{ key: 'DAC-1', doc_count: 5 }] },
    data_type: { buckets: [{ key: 'Genomic', doc_count: 10 }] },
  },
}

const mockDatasetsResponse = {
  hits: {
    total: { value: 1 },
    hits: [
      {
        _source: {
          datasetId: 1,
          datasetName: 'Dataset One',
          datasetIdentifier: 'DUOS-000001',
          accessManagement: 'controlled',
          study: {
            studyId: 101,
            studyName: 'Study One',
          },
        },
      },
    ],
  },
}

const mockStudiesResponse = {
  aggregations: {
    total_studies: { value: 2 },
    studies: {
      buckets: [
        {
          key: { study_id: 101 },
          study_details: { hits: { hits: [{ _source: { study: { studyName: 'Study One', description: 'Desc One' } } }] } },
          dataset_count: { value: 5 },
          total_participants: { value: 100 },
          dataset_ids: { buckets: [{ key: 1 }, { key: 2 }] },
        },
      ],
    },
  },
}

describe('DataLibrary', () => {
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
    cy.stub(Storage, 'getCurrentUser').as('getCurrentUserStub').returns({
      libraryCard: { cardNumber: '12345' },
    })
    cy.intercept('POST', '**/api/dataset/search/index/v2', (req) => {
      if (req.body.aggs?.studies) {
        req.reply(mockStudiesResponse)
      }
      else if (req.body.size === 0 && !req.body.queryTerm) {
        req.reply(mockMetadataResponse)
      }
      else {
        req.reply(mockDatasetsResponse)
      }
    }).as('searchApi')
  })

  it('renders the data library page', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('DUOS Data Library').should('be.visible')
    cy.contains('Search, filter, and select datasets').should('be.visible')
    cy.get('input[placeholder="Enter search terms"]').should('exist')
  })

  it('renders filter categories', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    cy.contains('Access Management').should('exist')
    cy.contains('Data Use').should('exist')
    cy.contains('Data Type').should('exist')
    cy.contains('Participants').should('exist')
  })

  it('toggles filters and updates URL state', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Check a filter
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').check()

    // Clear button should appear
    cy.contains('Clear').should('exist')

    // Check filter is active in UI
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').should('be.checked')
  })

  it('clears all filters', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?access=controlled']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Clear filters
    cy.contains('Clear').click()

    // Check filter is unchecked
    cy.contains('Controlled').closest('label').find('input[type="checkbox"]').should('not.be.checked')

    // Clear button should disappear
    cy.contains('Clear').should('not.exist')
  })

  it('initializes tab based on URL search params', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?tab=datasets']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Should be on Datasets tab (bold font-weight: 700)
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '400')
  })

  it('switches tabs and updates URL state', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Initially on Datasets (due to default in useLibraryUrlState)
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '700')

    // Switch to Studies
    cy.get('button').contains('Studies').click()
    cy.get('button').contains('Studies').should('have.css', 'font-weight', '700')
    cy.get('button').contains('Datasets').should('have.css', 'font-weight', '400')
  })

  it('shows footer when a dataset is selected', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?tab=datasets']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Footer should not be visible initially
    cy.get('[data-cy="library-footer"]').should('not.exist')

    // Click on the checkbox for the first row
    cy.get('.MuiDataGrid-row').first().find('input[type="checkbox"]').check()

    // Footer should now be visible
    cy.get('[data-cy="library-footer"]').should('be.visible')
    cy.contains('1 dataset selected from 1 study').should('be.visible')
  })

  it('shows footer when a study is selected', () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/?tab=studies']}>
          <DataLibrary />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Wait for the rows to appear
    cy.get('.MuiDataGrid-row').should('have.length', 1)

    // Selection on study with dataset_ids [{key: 1}, {key: 2}]
    cy.get('.MuiDataGrid-row').first().find('input[type="checkbox"]').check()

    // Footer should show 2 datasets (from mockStudiesResponse)
    cy.get('[data-cy="library-footer"]').should('be.visible')
    cy.contains('2 datasets selected from 1 study').should('be.visible')
  })

  describe('asset count', () => {
    const mountDefault = (tab = 'studies') => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/?tab=${tab}`]}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )
    }

    it('shows the plural studies count after loading', () => {
      // mockStudiesResponse has total_studies.value = 2
      mountDefault('studies')
      cy.wait('@searchApi')
      cy.contains('2 Studies').should('be.visible')
    })

    it('shows singular "Study" when total is 1', () => {
      cy.intercept('POST', '**/api/dataset/search/index/v2', (req) => {
        if (req.body.aggs?.studies) {
          req.reply({
            aggregations: {
              total_studies: { value: 1 },
              studies: {
                buckets: [
                  {
                    key: { study_id: 101 },
                    study_details: { hits: { hits: [{ _source: { study: { studyName: 'Only Study', description: '' } } }] } },
                    dataset_count: { value: 1 },
                    total_participants: { value: 50 },
                    dataset_ids: { buckets: [{ key: 1 }] },
                  },
                ],
              },
            },
          })
        }
        else {
          req.reply(mockMetadataResponse)
        }
      }).as('searchApiSingular')

      mountDefault('studies')
      cy.wait('@searchApiSingular')
      cy.contains('1 Study').should('be.visible')
    })

    it('shows the datasets count on the datasets tab', () => {
      // mockDatasetsResponse has hits.total.value = 1
      mountDefault('datasets')
      cy.wait('@searchApi')
      cy.contains('1 Dataset').should('be.visible')
    })

    it('shows plural "Datasets" when total is greater than 1', () => {
      cy.intercept('POST', '**/api/dataset/search/index/v2', (req) => {
        if (req.body.aggs?.studies) {
          req.reply(mockStudiesResponse)
        }
        else if (req.body.size === 0 && !req.body.queryTerm) {
          req.reply(mockMetadataResponse)
        }
        else {
          req.reply({
            hits: {
              total: { value: 42 },
              hits: [],
            },
          })
        }
      }).as('searchApiMultiple')

      mountDefault('datasets')
      cy.wait('@searchApiMultiple')
      cy.contains('42 Datasets').should('be.visible')
    })

    it('shows a loading skeleton while data is fetching', () => {
      cy.intercept('POST', '**/api/dataset/search/index/v2', (req) => {
        req.on('response', (res) => {
          res.setDelay(500)
        })
        if (req.body.aggs?.studies) {
          req.reply(mockStudiesResponse)
        }
        else if (req.body.size === 0 && !req.body.queryTerm) {
          req.reply(mockMetadataResponse)
        }
        else {
          req.reply(mockDatasetsResponse)
        }
      }).as('searchApiDelayed')

      mountDefault('studies')

      // Skeleton should be visible before the response arrives
      cy.get('[class*="MuiSkeleton"]').should('be.visible')

      // After loading, skeleton should be gone and count should show
      cy.wait('@searchApiDelayed')
      cy.get('[class*="MuiSkeleton"]').should('not.exist')
      cy.contains('2 Studies').should('be.visible')
    })
  })

  describe('Export functionality', () => {
    const emptyTdrResponse = { filteredTotal: 0, total: 0, items: [], roleMap: {} }

    beforeEach(() => {
      cy.viewport(2000, 900)
    })

    it('does not show export buttons when TDR returns no snapshots', () => {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves(emptyTdrResponse)

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/?tab=datasets']}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('.MuiDataGrid-row').should('have.length', 1)
      cy.contains('Export').should('not.exist')
    })

    it('shows export button when TDR returns a snapshot with reader role', () => {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves({
        filteredTotal: 1,
        total: 1,
        items: [{
          id: 'snapshot-abc',
          name: 'Snapshot ABC',
          duosId: 'DUOS-000001',
          cloudPlatform: 'gcp',
          resourceLocks: {},
        }],
        roleMap: { 'snapshot-abc': ['reader'] },
      })

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/?tab=datasets']}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('.MuiDataGrid-row').should('have.length', 1)
      cy.contains('Export').should('be.visible')
    })

    it('shows export button when TDR returns a snapshot with steward role', () => {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves({
        filteredTotal: 1,
        total: 1,
        items: [{
          id: 'snapshot-xyz',
          name: 'Snapshot XYZ',
          duosId: 'DUOS-000001',
          cloudPlatform: 'gcp',
          resourceLocks: {},
        }],
        roleMap: { 'snapshot-xyz': ['steward'] },
      })

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/?tab=datasets']}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('.MuiDataGrid-row').should('have.length', 1)
      cy.contains('Export').should('be.visible')
    })

    it('does not show export button for snapshots without reader or steward role', () => {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves({
        filteredTotal: 1,
        total: 1,
        items: [{
          id: 'snapshot-abc',
          name: 'Snapshot ABC',
          duosId: 'DUOS-000001',
          cloudPlatform: 'gcp',
          resourceLocks: {},
        }],
        roleMap: { 'snapshot-abc': ['discoverer'] },
      })

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/?tab=datasets']}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('.MuiDataGrid-row').should('have.length', 1)
      cy.contains('Export').should('not.exist')
    })

    it('does not show export buttons when on the Studies tab', () => {
      const listSnapshotsSpy = cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').resolves({
        filteredTotal: 1,
        total: 1,
        items: [{ id: 'snap-1', name: 'Snap', duosId: 'DUOS-000001', cloudPlatform: 'gcp', resourceLocks: {} }],
        roleMap: { 'snap-1': ['reader'] },
      })

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/?tab=studies']}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('.MuiDataGrid-row').should('have.length.at.least', 1)
      cy.wrap(listSnapshotsSpy).should('not.have.been.called')
      cy.contains('Export').should('not.exist')
    })

    it('handles TDR API errors gracefully and shows no export buttons', () => {
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').rejects(new Error('TDR API unavailable'))

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/?tab=datasets']}>
            <DataLibrary />
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('.MuiDataGrid-row').should('have.length', 1)
      cy.contains('Export').should('not.exist')
    })
  })

  describe('Branded Data Libraries', () => {
    it('renders branded library based on URL parameter (broad)', () => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/broad']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('Broad Data Library').should('be.visible')
      cy.contains('Search, filter, and select datasets').should('be.visible')
    })

    it('renders branded library based on URL parameter (anvil)', () => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/anvil']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('AnVIL Data Library').should('be.visible')
    })

    it('handles case-insensitive branded library query params', () => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/BROAD']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('Broad Data Library').should('be.visible')
    })

    it('captures metrics for default library', () => {
      cy.stub(Metrics, 'captureEvent').as('captureEvent')
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2']}>
            <Routes>
              <Route path="/datalibrary2" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('@captureEvent').should('have.been.calledWith', eventList.dataLibrary)
    })

    it('captures metrics with brand parameter for branded library', () => {
      cy.stub(Metrics, 'captureEvent').as('captureEvent')
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/broad']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('@captureEvent').should('have.been.calledWith', eventList.dataLibrary, { brand: 'broad' })
    })

    it('renders myinstitution library with user institution', () => {
      const mockUser = {
        userId: 123,
        institution: {
          id: 456,
          name: 'Test Institution',
        },
      }
      cy.get('@getCurrentUserStub').invoke('returns', mockUser)

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/myinstitution']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('Test Institution Data Library').should('be.visible')
    })

    it('redirects to profile when accessing myinstitution without institution', () => {
      const mockUser = {
        userId: 123,
        institution: null,
      }
      cy.get('@getCurrentUserStub').invoke('returns', mockUser)
      cy.stub(Notifications, 'showError').as('showError')

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/myinstitution']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('@showError').should('have.been.calledOnce')
    })

    it('redirects to profile when accessing myinstitution without user', () => {
      cy.get('@getCurrentUserStub').invoke('returns', null)
      cy.stub(Notifications, 'showError').as('showError')

      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/myinstitution']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.get('@showError').should('have.been.calledOnce')
    })

    it('falls back to default library for unknown brand', () => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/unknownbrand']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('DUOS Data Library').should('be.visible')
    })

    it('renders terra library without query filter', () => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/terra']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('Terra Data Library').should('be.visible')
    })

    it('renders elwazi library with data type filter', () => {
      cy.mount(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/datalibrary2/elwazi']}>
            <Routes>
              <Route path="/datalibrary2/:query" element={<DataLibrary />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )

      cy.contains('eLwazi Data Library').should('be.visible')
    })
  })
})
