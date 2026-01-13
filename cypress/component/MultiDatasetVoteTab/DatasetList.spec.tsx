import React from 'react'
import DatasetList from 'src/components/collection_voting_slab/DatasetList'
import { Storage } from 'src/libs/storage'
import { BrowserRouter } from 'react-router-dom'
import { DacTerm, Dataset } from 'src/types/model'

const datasets = [
  { datasetId: 1, datasetIdentifier: 'DUOS-1', name: 'Dataset 1', dacId: 1 } as Dataset,
  { datasetId: 2, datasetIdentifier: 'DUOS-2', name: 'Dataset 2', dacId: 1 } as Dataset,
]

const dacs = [{ dacId: 1, dacName: 'DAC 1' } as DacTerm]

const user = {
  isChairPerson: true,
}

describe('DatasetList', () => {
  it('renders a table with datasets', () => {
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.mount(
      <BrowserRouter>
        <DatasetList visibleDatasets={datasets} isLoading={false} dacs={dacs} />
      </BrowserRouter>,
    )
    cy.get('table').should('exist')
    cy.contains('Dataset Identifier')
    cy.contains('Dataset Name')
    cy.contains('DAC')
    cy.contains('DUOS-1')
    cy.contains('Dataset 1')
    cy.contains('DAC 1')
  })

  it('renders placeholder when loading', () => {
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.mount(
      <DatasetList visibleDatasets={datasets} isLoading={true} dacs={dacs} />,
    )
    cy.get('.text-placeholder').should('exist')
    cy.get('table').should('not.exist')
  })

  it('renders filler for missing datasetIdentifier', () => {
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.mount(
      <BrowserRouter>
        <DatasetList
          visibleDatasets={[{ datasetId: 3, name: 'Dataset 3', dacId: 1 } as Dataset]}
          isLoading={false}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.contains('- -')
    cy.contains('Dataset 3')
  })

  it('renders filler for missing name', () => {
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.mount(
      <BrowserRouter>
        <DatasetList
          visibleDatasets={[{ datasetId: 4, datasetIdentifier: 'DUOS-4', dacId: 1 } as Dataset]}
          isLoading={false}
          dacs={dacs}
        />
      </BrowserRouter>,
    )
    cy.contains('DUOS-4')
    cy.contains('- -')
  })

  it('renders DAC name as link for chair user', () => {
    cy.stub(Storage, 'getCurrentUser').returns(user)
    cy.mount(
      <BrowserRouter>
        <DatasetList visibleDatasets={datasets} isLoading={false} dacs={dacs} />
      </BrowserRouter>,
    )
    cy.get('a').contains('DAC 1').should('have.attr', 'href', '/manage_edit_dac/1')
  })

  it('renders DAC name as plain text for non-chair user', () => {
    cy.stub(Storage, 'getCurrentUser').returns({ isChairPerson: false })
    cy.mount(
      <BrowserRouter>
        <DatasetList visibleDatasets={datasets} isLoading={false} dacs={dacs} />
      </BrowserRouter>,
    )
    cy.get('table').should('exist')
    cy.contains('DAC 1')
    cy.get('a').contains('DAC 1').should('not.exist')
  })
})
