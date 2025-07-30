import React from 'react'
import { mount } from 'cypress/react'
import DucAddendum from 'src/pages/dar_application/DucAddendum'
import { makeDatasetTerm } from '../test-utils'
import { DataSet } from 'src/libs/ajax/DataSet'
import { AxiosError, AxiosResponse } from 'axios'

describe('DucAddendum', () => {
  const mockDatasets = [
    {
      datasetId: 1,
      datasetIdentifier: 'DUOS-1001',
      datasetName: 'Test Dataset 1',
      dacId: 1,
    },
    {
      datasetId: 2,
      datasetIdentifier: 'DUOS-1002',
      datasetName: 'Test Dataset 2',
      dacId: 2,
    },
  ]

  const mockDatasetTerms = [
    makeDatasetTerm({
      datasetId: 1,
      dac: {
        dacId: 1,
        dacName: 'DAC 0001',
        dacEmail: 'foo@bar.com',
      },
      dacId: 1,
    }),
    makeDatasetTerm({
      datasetId: 2,
      dac: {
        dacId: 2,
        dacName: 'DAC 0002',
        dacEmail: 'bar@foo.com',
      },
      dacId: 2,
    }),
  ]

  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  it('should render addendum table with selected datasets', () => {
    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve(mockDatasetTerms))

    const props = {
      datasets: mockDatasets,
      isLoading: false,
      save: cy.stub(),
      doSubmit: cy.stub(),
    }

    mount(<DucAddendum {...props} />)

    // Check the informational header
    cy.contains('Addendum').should('be.visible')
    cy.contains('Please review the datasets you requested').should('be.visible')

    // Verify column headers
    cy.contains('Dataset ID').should('be.visible')
    cy.contains('Dataset Name').should('be.visible')
    cy.contains('DAC').should('be.visible')
    cy.contains('Acknowledgment').should('be.visible')

    // Verify dataset row content
    cy.contains('DUOS-1001')
      .next().should('have.text', 'Test Dataset 1')
      .next().should('have.text', 'DAC 0001')

    cy.contains('DUOS-1002')
      .next().should('have.text', 'Test Dataset 2')
      .next().should('have.text', 'DAC 0002')
  })

  it('should display a warning when relevant DAC cannot be loaded', () => {
    const errorMessage = 'Error loading DAC information for datasets'
    cy.stub(DataSet, 'searchDatasetIndex').callsFake(() => {
      return Promise.reject(new AxiosError('DAC information could not be found', '500', undefined, undefined, { data: { message: errorMessage } } as AxiosResponse))
    })

    const props = {
      datasets: [mockDatasets.at(0)],
      isLoading: false,
      save: cy.stub(),
      doSubmit: cy.stub(),
    }

    mount(<DucAddendum {...props} />)

    cy.get('[data-cy="notification-alert"]').should('be.visible')
    cy.get('[data-cy="notification-alert"]').should('contain', errorMessage)
  })

  it('should display `N/A` when the DAC information is missing entirely', () => {
    const datasetTermsMissingDAC = makeDatasetTerm({
      datasetId: 1,
      dac: undefined,
    })

    cy.stub(DataSet, 'searchDatasetIndex').returns(Promise.resolve([datasetTermsMissingDAC]))

    const props = {
      datasets: [mockDatasets.at(0)],
      isLoading: false,
      save: cy.stub(),
      doSubmit: cy.stub(),
    }

    mount(<DucAddendum {...props} />)

    cy.contains('DUOS-1001')
      .next().should('have.text', 'Test Dataset 1')
      .next().should('have.text', 'N/A')
  })
})
