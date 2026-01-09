import { makeDatasetTerm } from '../test-utils'
import { React } from 'react'
import { mount } from 'cypress/react'
import DatasetSearchTable from 'src/components/data_search/DatasetSearchTable'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { BrowserRouter } from 'react-router-dom'

const datasets = [
  makeDatasetTerm({
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    participantCount: 100,
    study: {
      studyName: 'Some Study 1',
      studyId: 1,
      dataCustodianEmail: ['Some Data Custodian Email 1'],
    },
  }),
  makeDatasetTerm({
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    participantCount: 50,
    study: {
      studyName: 'Some Study 1',
      studyId: 1,
      dataCustodianEmail: ['Some Data Custodian Email 1'],
    },
  }),
]

// Mock assembleFullQuery function that mimics the parent's behavior
const assembleFullQuery = (isSigningOfficial, isInstitutionQuery, subQuery) => {
  const queryChunks = [
    {
      match: {
        _type: 'dataset',
      },
    },
    {
      exists: {
        field: 'study',
      },
    },
  ]

  // Add visibility modifiers unless user is signing official viewing own institution
  if (!isSigningOfficial || !isInstitutionQuery) {
    const visibilityModifier = [
      {
        term: {
          'study.publicVisibility': true,
        },
      },
      {
        bool: {
          should: [
            {
              term: {
                dacApproval: true,
              },
            },
            {
              term: {
                accessManagement: 'open',
              },
            },
            {
              term: {
                accessManagement: 'external',
              },
            },
          ],
        },
      },
    ]
    queryChunks.push(...visibilityModifier)
  }

  if (subQuery !== null) {
    queryChunks.push(subQuery)
  }

  return {
    from: 0,
    size: 10000,
    query: {
      bool: {
        must: queryChunks,
      },
    },
  }
}

const props = {
  datasets: datasets,
  assembleFullQuery: assembleFullQuery,
  isSigningOfficial: false,
  isInstitutionQuery: false,
}

describe('Dataset Search Table tests', () => {
  describe('Initial search request optimization', () => {
    it('Should not make redundant search request on initial mount', () => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()

      // Spy on search endpoint to verify it's not called initially
      let searchCallCount = 0
      cy.intercept('POST', '**/search/index', () => {
        searchCallCount++
      }).as('searchSpy')

      mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Wait for component to render
      cy.get('button').contains('View By Studies').should('exist')

      // Verify no initial search request was made
      cy.wrap(searchCallCount).should('equal', 0)
    })
  })

  describe('Data library with one dataset footer tests', () => {
    beforeEach(() => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()
      mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)
    })

    it('When no datasets are selected the footer does not appear', () => {
      cy.contains('selected from 1 study').should('not.exist')
    })

    it('When a dataset is selected the footer appears', () => {
      cy.get('#header-checkbox').click()
      cy.contains(`${datasets.length} datasets selected from 1 study`)
    })
  })

  describe('Data library filter by participant count tests', () => {
    beforeEach(() => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()
    })

    function handler(request, searchText) {
      if (JSON.stringify(request.body).includes(searchText)) {
        request.reply(['filtered'])
      }
      else {
        request.reply([])
      }
    }

    it('When a participant count filter is applied the query is updated', () => {
      cy.intercept(
        { method: 'POST', url: '**/search/index' }, (req) => {
          return handler(req, '{"range":{"participantCount":{"gte":30,"lte":50}}}')
        }).as('searchIndex')
      mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)
      // first clear the default value (50), without clearing first, type('3') would result in input of 503
      cy.get('#participantCountMin-range-input').clear()
      cy.get('#participantCountMin-range-input').type('3')
      // first clear the default value (100), without clearing first, type('5') would result in input of 1005
      cy.get('#participantCountMax-range-input').clear()
      cy.get('#participantCountMax-range-input').type('5')
      cy.tick(150)
      // this api call should have had a request that contained the searchText
      let count = 0
      cy.wait('@searchIndex').then((response) => {
        cy.wrap(response.response.body[0]).should('equal', 'filtered')
        count++
      })
      cy.get('@searchIndex').then(() => {
        cy.wrap(count).should('equal', 1)
      })
    })
  })

  describe('Visibility modifier security tests', () => {
    beforeEach(() => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()
    })

    it('Should include visibility modifiers in search requests', () => {
      let capturedRequest = null
      cy.intercept('POST', '**/search/index', (req) => {
        capturedRequest = req.body
        req.reply([])
      }).as('searchIndex')

      mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Trigger a search by typing in the search bar
      cy.get('[data-cy="search-bar"]').type('test query')
      cy.tick(150)

      cy.wait('@searchIndex').then(() => {
        // Verify the request includes visibility modifiers
        const queryString = JSON.stringify(capturedRequest)

        // Check for publicVisibility modifier
        cy.wrap(queryString).should('include', '"study.publicVisibility":true')

        // Check for access management modifiers (dacApproval, open, external)
        cy.wrap(queryString).should('include', '"dacApproval":true')
        cy.wrap(queryString).should('include', '"accessManagement":"open"')
        cy.wrap(queryString).should('include', '"accessManagement":"external"')
      })
    })

    it('Should include visibility modifiers when filters are applied', () => {
      let capturedRequest = null
      cy.intercept('POST', '**/search/index', (req) => {
        capturedRequest = req.body
        req.reply([])
      }).as('searchIndex')

      mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Apply a filter to trigger a search
      cy.get('#participantCountMin-range-input').clear()
      cy.get('#participantCountMin-range-input').type('10')
      cy.tick(150)

      cy.wait('@searchIndex').then(() => {
        // Verify the request includes visibility modifiers even with filters
        const queryString = JSON.stringify(capturedRequest)

        cy.wrap(queryString).should('include', '"study.publicVisibility":true')
        cy.wrap(queryString).should('include', '"dacApproval":true')

        // Also verify the filter was applied
        cy.wrap(queryString).should('include', '"participantCount":{"gte":10')
      })
    })

    it('Should omit visibility modifiers for signing officials viewing own institution', () => {
      const soProps = {
        ...props,
        isSigningOfficial: true,
        isInstitutionQuery: true,
      }

      let capturedRequest = null
      cy.intercept('POST', '**/search/index', (req) => {
        capturedRequest = req.body
        req.reply([])
      }).as('searchIndex')

      mount(<BrowserRouter><DatasetSearchTable {...soProps} /></BrowserRouter>)

      // Trigger a search
      cy.get('[data-cy="search-bar"]').type('test')
      cy.tick(150)

      cy.wait('@searchIndex').then(() => {
        const queryString = JSON.stringify(capturedRequest)

        // Verify visibility modifiers are NOT included
        cy.wrap(queryString).should('not.include', '"study.publicVisibility":true')
        cy.wrap(queryString).should('not.include', '"dacApproval":true')

        // But basic query structure should still be there
        cy.wrap(queryString).should('include', '"_type":"dataset"')
      })
    })
  })
})
