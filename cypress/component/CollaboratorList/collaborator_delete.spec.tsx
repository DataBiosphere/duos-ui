import React from 'react'
import { mount } from 'cypress/react'
import CollaboratorDelete from '../../../src/components/collaborator_list/CollaboratorDelete'

describe('CollaboratorDelete - Component Tests', () => {
  const defaultProps = {
    collaboratorName: 'John Doe',
    showDelete: true,
    confirmAction: () => { },
    closeAction: () => { },
  }

  it('renders the component correctly when showDelete is true', () => {
    mount(<CollaboratorDelete {...defaultProps} />)

    cy.get('.delete-modal').should('exist')
    cy.get('.delete-modal-header').should('contain', 'Delete Collaborator')
    cy.get('.delete-modal-title').contains('Are you sure you want to delete').should('be.visible')
    cy.get('.delete-modal-title strong').should('contain', 'John Doe')
    cy.get('.delete-modal-message').contains('This action is permanent').should('be.visible')
  })

  it('does not render when showDelete is false', () => {
    mount(<CollaboratorDelete {...defaultProps} showDelete={false} />)

    cy.get('.delete-modal').should('not.exist')
  })

  it('calls confirmAction when Delete button is clicked', () => {
    const confirmAction = cy.stub().as('confirmAction')
    mount(<CollaboratorDelete {...defaultProps} confirmAction={confirmAction} />)

    cy.get('.delete-modal-primary-button').contains('Delete').click()
    cy.get('@confirmAction').should('have.been.calledOnce')
  })

  it('calls closeAction when Cancel button is clicked', () => {
    const closeAction = cy.stub().as('closeAction')
    mount(<CollaboratorDelete {...defaultProps} closeAction={closeAction} />)

    cy.get('.delete-modal-secondary-button').contains('Cancel').click()
    cy.get('@closeAction').should('have.been.calledOnce')
  })

  it('calls closeAction when modal overlay is clicked', () => {
    const closeAction = cy.stub().as('closeAction')
    mount(<CollaboratorDelete {...defaultProps} closeAction={closeAction} />)

    cy.get('.ReactModal__Overlay').click({ force: true })

    cy.get('@closeAction').should('have.been.calledOnce')
  })

  it('calls closeAction when ESC key is pressed', () => {
    const closeAction = cy.stub().as('closeAction')
    mount(<CollaboratorDelete {...defaultProps} closeAction={closeAction} />)

    // Press ESC key to close modal
    cy.get('body').type('{esc}')

    cy.get('@closeAction').should('have.been.calledOnce')
  })

  it('displays different collaborator names correctly', () => {
    const testName = 'Jane Smith'
    mount(<CollaboratorDelete {...defaultProps} collaboratorName={testName} />)

    cy.get('.delete-modal-title strong').should('contain', testName)
  })

  it('has the correct styling on buttons', () => {
    mount(<CollaboratorDelete {...defaultProps} />)

    // Primary Delete button should be styled as contained
    cy.get('.delete-modal-primary-button')
      .should('contain', 'Delete')
      .and('have.css', 'background-color')
      .and('not.equal', 'rgba(0, 0, 0, 0)')

    // Secondary Cancel button should be styled as outlined
    cy.get('.delete-modal-secondary-button')
      .should('contain', 'Cancel')
      .and('have.css', 'background-color', 'rgb(255, 255, 255)')
  })

  it('displays permanent action warning message', () => {
    mount(<CollaboratorDelete {...defaultProps} />)

    cy.get('.delete-modal-message')
      .should('contain', 'This action is permanent and cannot be undone')
  })
})
