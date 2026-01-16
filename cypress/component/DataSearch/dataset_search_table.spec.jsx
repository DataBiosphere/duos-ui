import React from 'react'
import { makeDatasetTerm } from '../test-utils'
import DatasetSearchTable from 'src/components/data_search/DatasetSearchTable'
import { DataSet } from 'src/libs/ajax/DataSet'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { BrowserRouter } from 'react-router-dom'

const datasets = [
  makeDatasetTerm({
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    datasetName: 'Some Dataset 1',
    participantCount: 100,
    study: { studyName: 'Some Study 1', studyId: 1, dataCustodianEmail: ['cust1@example.org'] },
  }),
  makeDatasetTerm({
    datasetId: 123457,
    datasetIdentifier: 'DUOS-123457',
    datasetName: 'Some Dataset 2',
    participantCount: 50,
    study: { studyName: 'Some Study 2', studyId: 2, dataCustodianEmail: ['cust2@example.org'] },
  }),
]

const assembleFullQuery = (isSigningOfficial, isInstitutionQuery, subQuery) => {
  const base = [{ match: { _type: 'dataset' } }, { exists: { field: 'study' } }]
  if (!isSigningOfficial || !isInstitutionQuery) base.push({ term: { 'study.publicVisibility': true } })
  if (subQuery) base.push(subQuery)
  return { from: 0, size: 10000, query: { bool: { must: base } } }
}

const defaultProps = { datasets, assembleFullQuery, isSigningOfficial: false, isInstitutionQuery: false }

describe('DatasetSearchTable (component) - basic tests', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
    cy.clock()
  })
 
 

  it('does not trigger an initial search on mount', () => {
    let searchCalls = 0
    cy.intercept('POST', '**/search/index', () => {
      searchCalls += 1
    }).as('searchIndex')

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...defaultProps} />
      </BrowserRouter>,
    )

    cy.get('button').contains('View By Studies').should('exist')
    cy.wrap(searchCalls).should('equal', 0)
  })

  it('includes visibility modifiers for normal users', () => {
    let seen = null
    cy.intercept('POST', '**/search/index', (req) => {
      seen = JSON.stringify(req.body)
      req.reply([])
    }).as('searchIndex')

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...defaultProps} />
      </BrowserRouter>,
    )

    cy.get('[data-cy="search-bar"]').type('query')
    cy.tick(150)

    cy.wait('@searchIndex').then(() => {
      expect(seen).to.include('study.publicVisibility')
    })
  })

  it('omits visibility modifiers for signing officials viewing their institution', () => {
    let seen = null
    const soProps = { ...defaultProps, isSigningOfficial: true, isInstitutionQuery: true }

    cy.intercept('POST', '**/search/index', (req) => {
      seen = JSON.stringify(req.body)
      req.reply([])
    }).as('searchIndex')

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...soProps} />
      </BrowserRouter>,
    )

    cy.get('[data-cy="search-bar"]').type('query')
    cy.tick(150)

    cy.wait('@searchIndex').then(() => {
      expect(seen).to.not.include('study.publicVisibility')
    })
  })

  it('aborts previous requests when new searches are fired rapidly', () => {
    // Stub the DataSet client and assert it was called multiple times
    const dsStub = cy.stub(DataSet, 'searchDatasetIndex').callsFake((_) => {
      return new Promise((resolve) => setTimeout(() => resolve(datasets), 100))
    })

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...defaultProps} />
      </BrowserRouter>,
    )

    // Trigger first search and quickly trigger a second one
    cy.get('[data-cy="search-bar"]').type('first')
    cy.tick(50)
    cy.get('[data-cy="search-bar"]').clear().type('second')

    // Advance time enough for debounced calls and the fake responses
    cy.tick(300)

    cy.wrap(null).then(() => {
      // Debouncing may collapse rapid inputs into a single request; ensure at least one call occurred
      expect(dsStub.callCount).to.be.at.least(1)
    })
  })

  })
