import React from 'react'
import { LibraryDataGrid } from 'src/components/data_library/LibraryDataGrid'
import { AssetType, SortOrder, StudyAggregation } from 'src/types/library'
import { makeDatasetTerm } from '../test-utils'

const mockPaginationModel = {
  page: 0,
  pageSize: 25,
}

const mockSortModel: Array<{ field: string, sort: SortOrder | null }> = []

const studies: StudyAggregation[] = [
  {
    studyId: 1,
    studyName: 'Study 1',
    piName: 'PI 1',
    species: 'Human',
    phenotype: 'Condition A',
    dataCustodianEmail: ['custodian1@example.com'],
    datasetCount: 2,
    totalParticipants: 100,
    datasetIds: [101, 102],
  },
  {
    studyId: 2,
    studyName: 'Study 2',
    piName: 'PI 2',
    species: 'Mouse',
    phenotype: 'Condition B',
    dataCustodianEmail: ['custodian2@example.com'],
    datasetCount: 1,
    totalParticipants: 50,
    datasetIds: [201],
  },
]

const datasets = [
  makeDatasetTerm({
    datasetId: 101,
    datasetName: 'Dataset 101',
    participantCount: 60,
    accessManagement: 'controlled',
  }),
  makeDatasetTerm({
    datasetId: 102,
    datasetName: 'Dataset 102',
    participantCount: 40,
    accessManagement: 'open',
  }),
  makeDatasetTerm({
    datasetId: 103,
    datasetName: 'Dataset 103',
    participantCount: 20,
    accessManagement: 'external',
  }),
]

describe('LibraryDataGrid', () => {
  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  it('renders study data correctly', () => {
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.STUDIES}
        data={studies}
        loading={false}
        total={2}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub().as('onPaginationChange')}
        sortModel={mockSortModel}
        onSortChange={cy.stub().as('onSortChange')}
        selectedDatasetIds={[]}
        onSelectionChange={cy.stub().as('onSelectionChange')}
      />,
    )

    cy.contains('Study 1').should('exist')
    cy.contains('PI 1').should('exist')
    cy.contains('Human').should('exist')
    cy.contains('Condition A').should('exist')
    cy.contains('100').should('exist') // Participants
    cy.contains('2').should('exist') // Datasets

    cy.contains('Study 2').should('exist')
  })

  it('renders dataset data correctly', () => {
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.DATASETS}
        data={datasets}
        loading={false}
        total={3}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub().as('onPaginationChange')}
        sortModel={mockSortModel}
        onSortChange={cy.stub().as('onSortChange')}
        selectedDatasetIds={[]}
        onSelectionChange={cy.stub().as('onSelectionChange')}
      />,
    )

    cy.contains('Dataset 101').should('exist')
    cy.contains('60').should('exist')
    cy.get('.MuiChip-label').contains('Controlled').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorPrimary').should('exist')

    cy.contains('Dataset 102').should('exist')
    cy.contains('40').should('exist')
    cy.get('.MuiChip-label').contains('Open').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorSuccess').should('exist')

    cy.contains('Dataset 103').should('exist')
    cy.contains('20').should('exist')
    cy.get('.MuiChip-label').contains('External').should('exist')
    cy.get('.MuiChip-root.MuiChip-colorSecondary').should('exist')
  })

  it('handles row selection for datasets', () => {
    const onSelectionChange = cy.stub().as('onSelectionChange')
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.DATASETS}
        data={datasets}
        loading={false}
        total={2}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub()}
        sortModel={mockSortModel}
        onSortChange={cy.stub()}
        selectedDatasetIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    )

    cy.get('.MuiDataGrid-row[data-id="101"] .MuiDataGrid-checkboxInput input').check()
    cy.get('@onSelectionChange').should('have.been.calledWith', [101])
  })

  it('handles row selection for studies (mapping to dataset IDs)', () => {
    const onSelectionChange = cy.stub().as('onSelectionChange')
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.STUDIES}
        data={studies}
        loading={false}
        total={2}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub()}
        sortModel={mockSortModel}
        onSortChange={cy.stub()}
        selectedDatasetIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    )

    cy.get('.MuiDataGrid-row[data-id="1"] .MuiDataGrid-checkboxInput input').check()
    cy.get('@onSelectionChange').should('have.been.calledWith', [101, 102])
  })

  it('renders loading state', () => {
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.STUDIES}
        data={[]}
        loading={true}
        total={0}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub()}
        sortModel={mockSortModel}
        onSortChange={cy.stub()}
        selectedDatasetIds={[]}
        onSelectionChange={cy.stub()}
      />,
    )

    cy.get('.MuiCircularProgress-root').should('be.visible')
  })

  it('renders empty state when no data exists', () => {
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.STUDIES}
        data={[]}
        loading={false}
        total={0}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub()}
        sortModel={mockSortModel}
        onSortChange={cy.stub()}
        selectedDatasetIds={[]}
        onSelectionChange={cy.stub()}
      />,
    )

    cy.contains('No studies found matching your criteria').should('be.visible')
  })

  it('calls onPaginationChange when page changes', () => {
    const onPaginationChange = cy.stub().as('onPaginationChange')
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.STUDIES}
        data={studies}
        loading={false}
        total={100}
        paginationModel={mockPaginationModel}
        onPaginationChange={onPaginationChange}
        sortModel={mockSortModel}
        onSortChange={cy.stub()}
        selectedDatasetIds={[]}
        onSelectionChange={cy.stub()}
      />,
    )

    cy.get('button[aria-label="Go to next page"]').click()
    cy.get('@onPaginationChange').should('have.been.calledWith', {
      page: 1,
      pageSize: 25,
    })
  })

  it('calls onSortChange when header is clicked', () => {
    const onSortChange = cy.stub().as('onSortChange')
    cy.mount(
      <LibraryDataGrid
        assetType={AssetType.STUDIES}
        data={studies}
        loading={false}
        total={2}
        paginationModel={mockPaginationModel}
        onPaginationChange={cy.stub()}
        sortModel={mockSortModel}
        onSortChange={onSortChange}
        selectedDatasetIds={[]}
        onSelectionChange={cy.stub()}
      />,
    )

    cy.contains('Study Name').click()
    cy.get('@onSortChange').should('have.been.calledWith', [
      { field: 'studyName', sort: 'asc' },
    ])
  })
})
