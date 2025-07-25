import React from 'react'
import { mount } from 'cypress/react'
import ConfirmationModal from '../../../src/components/modals/ConfirmationModal'

describe('ConfirmationModal z-index Tests', () => {
  it('should have a high z-index to appear above navigation', () => {
    const mockProps = {
      showConfirmation: true,
      closeConfirmation: () => {},
      title: 'Test Modal',
      message: 'Test message',
      header: 'Test Header',
      onConfirm: () => {}
    }

    mount(<ConfirmationModal {...mockProps} />)

    // Check that modal content has the correct z-index
    cy.get('.confirmation-modal')
      .should('exist')
      .should('have.css', 'z-index', '1080')

    // Check that modal overlay has the correct z-index
    cy.get('.confirmation-modal-overlay')
      .should('exist')
      .should('have.css', 'z-index', '1075')
  })

  it('should render confirmation modal with proper structure', () => {
    const mockProps = {
      showConfirmation: true,
      closeConfirmation: cy.stub(),
      title: 'Delete DAR',
      message: 'Are you sure you want to delete this DAR?',
      header: 'DAR-123 - Test Project',
      onConfirm: cy.stub()
    }

    mount(<ConfirmationModal {...mockProps} />)

    cy.get('.confirmation-modal-header').should('contain', 'DAR-123 - Test Project')
    cy.get('.confirmation-modal-title').should('contain', 'Delete DAR')
    cy.get('.confirmation-modal-message').should('contain', 'Are you sure you want to delete this DAR?')
    cy.get('.confirmation-modal-primary-button').should('contain', 'Confirm')
    cy.get('.confirmation-modal-secondary-button').should('contain', 'Cancel')
  })
})
