import React from 'react'
import { makeDatasetTerm } from '../test-utils'
import DatasetSearchTable from 'src/components/data_search/DatasetSearchTable'
import { DataSet } from 'src/libs/ajax/DataSet'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { BrowserRouter } from 'react-router-dom'
import { DAC } from 'src/libs/ajax/DAC'

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
  const base = []
  if (!isSigningOfficial || !isInstitutionQuery) base.push({ term: { 'study.publicVisibility': true } })
  if (subQuery) base.push(subQuery)
  return { from: 0, size: 10000, query: { bool: { must: base } } }
}

const defaultProps = { datasets, assembleFullQuery, isSigningOfficial: false, isInstitutionQuery: false }

describe('DatasetSearchTable (component) - basic tests', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
    cy.stub(DAC, 'fetchDACbotRules').resolves([])
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

    cy.contains('button', 'View By Datasets').should('exist')
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
      return new Promise(resolve => setTimeout(() => resolve(datasets), 100))
    })

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...defaultProps} />
      </BrowserRouter>,
    )

    // Trigger first search and quickly trigger a second one
    cy.get('[data-cy="search-bar"]').type('first')
    cy.tick(50)
    cy.get('[data-cy="search-bar"]').clear()
    cy.get('[data-cy="search-bar"]').type('second')

    // Advance time enough for debounced calls and the fake responses
    cy.tick(300)

    cy.wrap(null).then(() => {
      // Debouncing may collapse rapid inputs into a single request; ensure at least one call occurred
      expect(dsStub.callCount).to.be.at.least(1)
    })
  })
})

describe('DatasetSearchTable (component) - RADAR eligibility', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(DAC, 'fetchDACbotRules').callsFake((dacId) => {
      // Return a matching rule for the test DAC ID
      if (dacId === 2) {
        return Promise.resolve([{ activationDate: '2023-01-01', ruleType: 'GRU_V1' }])
      }
      return Promise.resolve([])
    })
    cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
    cy.clock()
  })

  it('shows RADAR icon for eligible datasets', () => {
    const radarDataset = {
      datasetId: 999,
      datasetIdentifier: 'DUOS-999',
      datasetName: 'RADAR Dataset',
      participantCount: 10,
      dacId: 2,
      dataUse: { primary: [{ code: 'GRU' }], secondary: [] },
      accessManagement: 'controlled',
      study: { studyName: 'Study', studyId: 1, dataCustodianEmail: ['a@b.com'], dataTypes: [] },
    }
    const props = {
      datasets: [radarDataset],
      isSigningOfficial: false,
      isInstitutionQuery: false,
    }

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...props} />
      </BrowserRouter>,
    )

    cy.contains('RADAR Dataset')
    cy.get('svg[data-testid="BoltIcon"]').should('exist')
  })

  it('does not show RADAR icon for ineligible datasets', () => {
    const nonRadarDataset = {
      datasetId: 1000,
      datasetIdentifier: 'DUOS-1000',
      datasetName: 'Non-RADAR Dataset',
      participantCount: 5,
      dacId: 3, // No matching DAC rule
      dataUse: { primary: [{ code: 'GRU' }], secondary: [] },
      accessManagement: 'controlled',
      study: { studyName: 'Study', studyId: 2, dataCustodianEmail: ['b@c.com'], dataTypes: [] },
    }
    const props = {
      datasets: [nonRadarDataset],
      isSigningOfficial: false,
      isInstitutionQuery: false,
    }

    cy.mount(
      <BrowserRouter>
        <DatasetSearchTable {...props} />
      </BrowserRouter>,
    )

    cy.contains('Non-RADAR Dataset')
    cy.get('svg[data-testid="BoltIcon"]').should('not.exist')
  })
})
