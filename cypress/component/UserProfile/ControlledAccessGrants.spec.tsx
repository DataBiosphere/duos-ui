import React from 'react'
import ControlledAccessGrants from 'src/pages/user_profile/ControlledAccessGrants'
import { User } from 'src/libs/ajax/User'

describe('ControlledAccessGrants', () => {
  beforeEach(() => {
    cy.viewport(1000, 500)
  })

  it('should render the component with correct header and description', () => {
    cy.stub(User, 'getApprovedDatasets').returns(Promise.resolve([]))

    cy.mount(<ControlledAccessGrants />)

    cy.get('[data-cy="table-header-title"]').should('exist')
    cy.get('[data-cy="table-header-title"]').should('contain', 'Controlled Access Grants')

    cy.get('[data-cy="table-header-description"]').should('exist')
    cy.get('[data-cy="table-header-description"]').should('contain', 'Your current dataset approvals')

    // Check if all the expected table headers are present
    cy.get('table').should('exist')
    cy.contains('th', 'DAR Code').should('be.visible')
    cy.contains('th', 'Dataset Identifier').should('be.visible')
    cy.contains('th', 'Dataset Name').should('be.visible')
    cy.contains('th', 'DAC Name').should('be.visible')
    cy.contains('th', 'Expiration Date').should('be.visible')
  })

  it('should display dataset information', () => {
    const mockDatasets = [
      {
        darCode: 'DAR-001',
        datasetIdentifier: 'DS-123',
        datasetName: 'Test Dataset 1',
        dacName: 'DAC 1',
        expirationDate: 1742014831956,
      },
      {
        darCode: 'DAR-002',
        datasetIdentifier: 'DS-456',
        datasetName: 'Test Dataset 2',
        dacName: 'DAC 2',
        expirationDate: 1752014831956,
      },
    ]

    cy.stub(User, 'getApprovedDatasets').returns(Promise.resolve(mockDatasets))

    cy.mount(<ControlledAccessGrants />)

    cy.contains('DAR-001').should('be.visible')
    cy.contains('DS-123').should('be.visible')
    cy.contains('Test Dataset 1').should('be.visible')
    cy.contains('DAC 1').should('be.visible')
    cy.contains('2025-03-15').should('be.visible')

    cy.contains('DAR-002').should('be.visible')
    cy.contains('DS-456').should('be.visible')
    cy.contains('Test Dataset 2').should('be.visible')
    cy.contains('DAC 2').should('be.visible')
    cy.contains('2025-07-08').should('be.visible')
  })
})
