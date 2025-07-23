import React from 'react'
import { mount } from 'cypress/react'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { DarCollectionTableColumnOptions } from 'src/utils/DarCollectionUtils.js'

const collections = [
  {
    darCollectionId: 211,
    darCode: 'DAR-259',
    datasets: [{}, {}],
  },
]

describe('DarCollectionTable - Tests', function () {
  it('renders a single column of the data', function () {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE,
    ]
    mount(
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
    mount(
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
    mount(
      <DarCollectionTable
        isLoading={true}
      />,
    )
    cy.get('.table-data').should('exist')
    cy.get('.table-loading-placeholder').should('exist')
  })
})
