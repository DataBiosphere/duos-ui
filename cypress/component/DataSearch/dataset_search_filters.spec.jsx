import { makeDatasetTerm, makeStudyTerm } from '../test-utils'
import { mount } from 'cypress/react'
import React from 'react'
import { defaultFilters } from 'src/components/data_search/DatasetFilterConstants'
import DatasetFilterList from 'src/components/data_search/DatasetFilterList'

const datasets = [
  makeDatasetTerm({
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1',
    participantCount: 100,
    study: makeStudyTerm({
      studyName: 'Some Study 1',
      studyId: 1,
      dataCustodianEmail: ['Some Data Custodian Email 1'],
    }),
  }),
  makeDatasetTerm({
    datasetId: 123457,
    datasetIdentifier: `DUOS-123457`,
    datasetName: 'Some Dataset 2',
    participantCount: 2,
    study: makeStudyTerm({
      studyName: 'Some Study 1',
      studyId: 1,
      dataCustodianEmail: ['Some Data Custodian Email 1'],
    }),
  }),
]

describe('Data Library Filters', () => {
  // Intercept configuration calls
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('Renders the data library filters', () => {
    const props = { datasets, filters: defaultFilters(datasets), filterHandler: () => {}, isFiltered: () => {} }
    mount(<DatasetFilterList {...props} />)
    cy.get('div').should('contain', 'Filters')
    cy.get('div').should('contain', 'Access Type')
    cy.get('div').should('contain', 'Data Use')
    cy.get('div').should('contain', 'Data Access Committee')
    // cy.get('div').should('contain', 'Data Type') // Temporarily hide Data Type filter until we have better data
    cy.get('div').should('contain', 'Participant Count')
  })

  it('initially defaults to minimum and maximum participant counts in datasets', () => {
    const props = { datasets, filters: defaultFilters(datasets), filterHandler: () => {}, isFiltered: () => {} }
    mount(<DatasetFilterList {...props} />)
    cy.get('#participantCountMax-range-input').should('have.value',
      datasets[0].participantCount)
    cy.get('#participantCountMin-range-input').should('have.value',
      datasets[1].participantCount)
  })

  it('calls the filter handler on range changes', () => {
    const filterHandlerStub = cy.stub()
    const props = { datasets, filters: { ...defaultFilters(datasets), participantCountMin: 2, participantCountMax: 5 }, filterHandler: filterHandlerStub, isFiltered: () => {} }
    mount(<DatasetFilterList {...props} />)
    cy.get('#participantCountMax-range-input').type('3')
    filterHandlerStub.calledWith('participantCountMax', 53)
    cy.get('#participantCountMin-range-input').type('3')
    filterHandlerStub.calledWith('participantCountMin', 23)
  })
})
