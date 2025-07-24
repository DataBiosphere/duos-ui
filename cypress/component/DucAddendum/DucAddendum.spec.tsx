import React from 'react'
import { mount } from 'cypress/react'
import DucAddendum from 'src/pages/dar_application/DucAddendum'
import { DAC } from 'src/libs/ajax/DAC'

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

  const mockDacs = [
    {
      dacId: 1,
      name: 'DAC 0001',
    },
    {
      dacId: 2,
      name: 'DAC 0002',
    },
  ]

  beforeEach(() => {
    cy.viewport(1200, 800)
  })

  it('should render addendum table with selected datasets', () => {
    cy.stub(DAC, 'list').returns(Promise.resolve(mockDacs))
    cy.stub(DAC, 'get').callsFake((dacId) => {
      return Promise.resolve(mockDacs.find(dac => dac.dacId === dacId))
    })

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

  it('should display `Unknown DAC` when relevant DAC cannot be loaded', () => {
    cy.stub(DAC, 'list').returns(Promise.resolve(mockDacs))
    cy.stub(DAC, 'get').callsFake(() => {
      return Promise.reject(new Error('DAC not found'))
    })

    const props = {
      datasets: [mockDatasets.at(0)],
      isLoading: false,
      save: cy.stub(),
      doSubmit: cy.stub(),
    }

    mount(<DucAddendum {...props} />)

    cy.contains('Unknown DAC').should('be.visible')
    cy.contains('Error loading DAC information for datasets').should('be.visible')
  })
})
