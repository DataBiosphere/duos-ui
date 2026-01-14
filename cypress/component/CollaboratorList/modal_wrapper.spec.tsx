import React from 'react'
import ModalWrapper from '../../../src/components/collaborator_list/ModalWrapper'

describe('ModalWrapper - Component Tests', () => {
  it('renders with default props', () => {
    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
      >
        <div data-cy="modal-content">Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.ReactModal__Content').should('exist')
    cy.get('[data-cy=modal-content]').should('be.visible')
    cy.contains('Test Content').should('be.visible')
  })

  it('does not render when isOpen is false', () => {
    cy.mount(
      <ModalWrapper
        isOpen={false}
        ariaHideApp={false}
      >
        <div data-cy="modal-content">Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.ReactModal__Content').should('not.exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
        className="custom-modal-class"
      >
        <div>Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.custom-modal-class').should('exist')
  })

  it('applies overlayClassName', () => {
    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
        overlayClassName="custom-overlay-class"
      >
        <div>Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.custom-overlay-class').should('exist')
  })

  it('handles onAfterOpen callback', () => {
    const onAfterOpen = cy.stub().as('afterOpenCallback')

    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
        onAfterOpen={onAfterOpen}
      >
        <div>Test Content</div>
      </ModalWrapper>,
    )

    cy.get('@afterOpenCallback').should('have.been.called')
  })

  it('handles onRequestClose callback when clicking overlay', () => {
    const onRequestClose = cy.stub().as('requestCloseCallback')

    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
        onRequestClose={onRequestClose}
        shouldCloseOnOverlayClick={true}
      >
        <div data-cy="modal-content">Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.ReactModal__Overlay').click({ force: true })
    cy.get('@requestCloseCallback').should('have.been.called')
  })

  it('supports custom styling', () => {
    const customStyle = {
      content: {
        backgroundColor: 'rgb(255, 0, 0)',
      },
    }

    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
        style={customStyle}
      >
        <div>Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.ReactModal__Content').should('have.css', 'background-color', 'rgb(255, 0, 0)')
  })

  it('renders with custom content label', () => {
    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
        contentLabel="Test Modal Label"
      >
        <div>Test Content</div>
      </ModalWrapper>,
    )

    cy.get('.ReactModal__Content').should('have.attr', 'aria-label', 'Test Modal Label')
  })

  it('allows nested interactive elements to work', () => {
    const buttonClickStub = cy.stub().as('buttonClickHandler')

    cy.mount(
      <ModalWrapper
        isOpen={true}
        ariaHideApp={false}
      >
        <button data-cy="modal-button" onClick={buttonClickStub}>Click Me</button>
      </ModalWrapper>,
    )

    cy.get('[data-cy=modal-button]').click()
    cy.get('@buttonClickHandler').should('have.been.called')
  })
})
