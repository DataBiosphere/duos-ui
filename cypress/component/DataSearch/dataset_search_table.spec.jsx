import { makeDatasetTerm } from '../test-utils'
import { React } from 'react'
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

<<<<<<< HEAD
      mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)
=======
      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)
>>>>>>> b51a5b97737c0aa7d78c6431bb3525ce1512ba75

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
      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)
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
      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)
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

<<<<<<< HEAD
  describe('Visibility modifier security tests', () => {
=======
  describe('Request abort handling tests', () => {
>>>>>>> b51a5b97737c0aa7d78c6431bb3525ce1512ba75
    beforeEach(() => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()
    })

<<<<<<< HEAD
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
=======
    it('Should abort previous request when new search is triggered rapidly', () => {
      let requestCount = 0

      const interceptHandler = (req) => {
        requestCount++
        // Simulate different response times
        const delay = requestCount === 1 ? 300 : 50
        req.reply({ delay, body: datasets })
      }

      cy.intercept('POST', '**/search/index', interceptHandler).as('searchIndex')
      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Trigger first search
      cy.get('[data-cy="search-bar"]').type('first')
      cy.tick(150) // Debounce delay

      // Quickly trigger second search before first completes
      cy.get('[data-cy="search-bar"]').clear()
      cy.get('[data-cy="search-bar"]').type('second')
      cy.tick(150)

      // Wait for the last request
      cy.wait('@searchIndex')

      // Advance time to ensure all requests complete
      cy.tick(500)

      // Verify multiple requests were made (abort controller creates new requests)
      cy.wrap(null).then(() => {
        expect(requestCount).to.be.at.least(2)
      })
    })

    it('Should handle rapid filter changes gracefully', () => {
      let requestCount = 0

      const interceptHandler = (req) => {
        requestCount++
        req.reply({ delay: 50, body: datasets })
      }

      cy.intercept('POST', '**/search/index', interceptHandler).as('searchIndex')
      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Rapidly change filters (each change should debounce and potentially abort previous)
      cy.get('#participantCountMin-range-input').clear()
      cy.get('#participantCountMin-range-input').type('10')
      cy.tick(50)
      cy.get('#participantCountMin-range-input').clear()
      cy.get('#participantCountMin-range-input').type('20')
      cy.tick(50)
      cy.get('#participantCountMin-range-input').clear()
      cy.get('#participantCountMin-range-input').type('30')
      cy.tick(150) // Complete debounce

      // Wait for request to complete
      cy.wait('@searchIndex')
      cy.tick(100)

      // The debounce should limit the number of actual requests
      cy.wrap(null).then(() => {
        // With 150ms debounce and rapid changes, should only fire one request
        expect(requestCount).to.equal(1)
      })
    })

    it('Should not throw errors when requests are aborted', () => {
      // Capture any console errors
      const consoleErrors = []
      const errorCapture = (...args) => {
        consoleErrors.push(args)
      }

      const windowLoadHandler = (win) => {
        cy.stub(win.console, 'error').callsFake(errorCapture)
      }

      const interceptHandler = (req) => {
        req.reply({ delay: 200, body: datasets })
      }

      cy.on('window:before:load', windowLoadHandler)
      cy.intercept('POST', '**/search/index', interceptHandler).as('searchIndex')
      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Trigger multiple searches rapidly
      cy.get('[data-cy="search-bar"]').type('test1')
      cy.tick(50)
      cy.get('[data-cy="search-bar"]').clear()
      cy.get('[data-cy="search-bar"]').type('test2')
      cy.tick(50)
      cy.get('[data-cy="search-bar"]').clear()
      cy.get('[data-cy="search-bar"]').type('test3')
      cy.tick(150)

      // Wait for final request
      cy.wait('@searchIndex')

      // No AbortError should be logged to console
      cy.wrap(null).then(() => {
        const abortErrors = consoleErrors.filter(error =>
          error.some(arg => typeof arg === 'string' && arg.includes('AbortError')),
        )
        expect(abortErrors).to.have.length(0)
>>>>>>> b51a5b97737c0aa7d78c6431bb3525ce1512ba75
      })
    })
  })
})
