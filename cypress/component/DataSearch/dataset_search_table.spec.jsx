import { makeDatasetTerm } from '../test-utils'
import { React } from 'react'
import { mount } from 'cypress/react'
import DatasetSearchTable from 'src/components/data_search/DatasetSearchTable'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'

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
  history: {},
}

describe('Dataset Search Table tests', () => {
  describe('Data library with one dataset footer tests', () => {
    beforeEach(() => {
      cy.initApplicationConfig()
      cy.stub(TerraDataRepo, 'listSnapshotsByDatasetIds').returns({})
      cy.clock()
      mount(<DatasetSearchTable {...props} />)
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
      mount(<DatasetSearchTable {...props} />)
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
})
