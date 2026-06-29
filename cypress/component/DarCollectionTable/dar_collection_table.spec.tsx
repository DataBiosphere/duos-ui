import React from 'react'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils.js'
import { Collections } from 'src/libs/ajax/Collections'
import { Match } from 'src/libs/ajax/Match'
import { DataSet } from 'src/libs/ajax/DataSet'
import { MemoryRouter } from 'react-router-dom'
import darCollection from './darCollection.json'

const collections = [
  {
    darCollectionId: 211,
    darCode: 'DAR-259',
    datasets: [{}, {}],
  },
]

describe('DarCollectionTable - Tests', function () {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('renders a single column of the data', function () {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE,
    ]
    cy.mount(
      <DarCollectionTable
        collections={collections}
        columns={columns}
        isRendered={true}
        isLoading={false}
        cancelCollection={null}
        reviseCollection={null}
        actionsDisabled={false}
      />,
    )
    cy.get('.column-header').should('have.length', 1)
  })

  it('renders multiple rows of the data', function () {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.DATASET_COUNT,
    ]
    cy.mount(
      <DarCollectionTable
        collections={collections}
        columns={columns}
        isRendered={true}
        isLoading={false}
        cancelCollection={null}
        reviseCollection={null}
        actionsDisabled={false}
      />,
    )
    cy.get('.column-header').should('have.length', 2)
  })

  it('should render skeleton table if isLoading is true', function () {
    cy.mount(
      <DarCollectionTable
        isLoading={true}
      />,
    )
    cy.get('.table-data').should('exist')
    cy.get('.table-loading-placeholder').should('exist')
  })

  it('shows datasets when expanded in signing official console', function () {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.DATASET_COUNT,
    ]

    cy.stub(Collections, 'getCollectionById').resolves(darCollection)
    cy.stub(Match, 'findMatchBatch').resolves([])
    cy.stub(DataSet, 'searchDatasetIndex').resolves([{
      datasetId: 2352,
      datasetIdentifier: 'DUOS-000850',
      dataUse: {
        primary: [{ code: 'GRU', description: 'General Research Use' }],
        secondary: [{ code: 'NPU', description: 'Non-Profit Use' }],
      },
      dacId: 8,
      dac: { dacId: 8, name: 'DAC 8' },
    }])

    cy.mount(
      <MemoryRouter>
        <DarCollectionTable
          collections={collections}
          columns={columns}
          isRendered={true}
          isLoading={false}
          cancelCollection={null}
          reviseCollection={null}
          actionsDisabled={false}
          consoleType={consoleTypes.SIGNING_OFFICIAL}
        />
      </MemoryRouter>,
    )

    cy.get('#211_dropdown').click()
    cy.contains('DUOS-000850').should('exist')
  })
})
