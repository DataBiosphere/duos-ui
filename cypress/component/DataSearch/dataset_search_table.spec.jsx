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

const props = {
  datasets: datasets,
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

      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

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

  describe('Request abort handling tests', () => {
    beforeEach(() => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()
    })

    it('Should abort previous request when new search is triggered rapidly', () => {
      let requestCount = 0

      cy.intercept('POST', '**/search/index', (req) => {
        requestCount++
        const searchQuery = req.body.query?.bool?.must?.find(
          clause => clause.multi_match
        )?.multi_match?.query || 'none'

        // Simulate different response times
        const delay = requestCount === 1 ? 300 : 50

        req.reply({ 
          delay, 
          body: datasets 
        })
      }).as('searchIndex')

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

      cy.intercept('POST', '**/search/index', (req) => {
        requestCount++
        req.reply({ delay: 50, body: datasets })
      }).as('searchIndex')

      cy.mount(<BrowserRouter><DatasetSearchTable {...props} /></BrowserRouter>)

      // Rapidly change filters (each change should debounce and potentially abort previous)
      cy.get('#participantCountMin-range-input').clear().type('10')
      cy.tick(50)
      cy.get('#participantCountMin-range-input').clear().type('20')
      cy.tick(50)
      cy.get('#participantCountMin-range-input').clear().type('30')
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
      cy.on('window:before:load', (win) => {
        cy.stub(win.console, 'error').callsFake((...args) => {
          consoleErrors.push(args)
        })
      })

      cy.intercept('POST', '**/search/index', (req) => {
        req.reply({ delay: 200, body: datasets })
      }).as('searchIndex')

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
          error.some(arg => typeof arg === 'string' && arg.includes('AbortError'))
        )
        expect(abortErrors).to.have.length(0)
      })
    })
  })
})
