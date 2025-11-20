import React from 'react'
import { mount } from 'cypress/react'
import AddObjectButton from 'src/components/AddObjectButton'

describe('AddObjectButton', () => {
  it('renders with required props', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
      />,
    )

    cy.get('#test-button').should('exist')
    cy.get('#test-button').should('contain.text', 'Add Test')
    cy.get('#test-button').find('svg').should('exist') // AddIcon
  })

  it('calls onClick when clicked', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
      />,
    )

    cy.get('#test-button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('does not call onClick when disabled', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
        disabled={true}
      />,
    )

    cy.get('#test-button').should('be.disabled')
    cy.get('#test-button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('applies correct styling when disabled', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        disabled={true}
      />,
    )

    cy.get('#test-button').should('have.css', 'cursor', 'not-allowed')
  })

  it('shows validation error styling', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        hasValidationError={true}
      />,
    )

    cy.get('#test-button').should('have.css', 'border', '1px solid rgb(255, 0, 0)')
    cy.get('#test-button').should('have.css', 'box-shadow').and('include', 'rgb(255, 0, 0)')
  })

  it('shows default styling without validation error', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        hasValidationError={false}
      />,
    )

    cy.get('#test-button').should('have.css', 'border').and('include', 'rgb(9, 72, 183)')
    cy.get('#test-button').should('have.css', 'box-shadow', 'none')
  })

  it('applies button-white class', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    cy.get('#test-button').should('have.class', 'button')
    cy.get('#test-button').should('have.class', 'button-white')
  })

  it('applies correct layout styles', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    cy.get('#test-button').should('have.css', 'display', 'flex')
    cy.get('#test-button').should('have.css', 'align-items', 'center')
    cy.get('#test-button').should('have.css', 'margin-top', '0px')
    cy.get('#test-button').should('have.css', 'margin-bottom', '5px')
  })

  it('renders with custom icon', () => {
    const CustomIcon = () => <span data-testid="custom-icon">★</span>

    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        icon={<CustomIcon />}
      />,
    )

    cy.get('[data-testid="custom-icon"]').should('exist')
    cy.get('[data-testid="custom-icon"]').should('contain.text', '★')
  })

  it('renders with default AddIcon when icon prop not provided', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    cy.get('#test-button').find('svg').should('exist')
    cy.get('#test-button').find('[data-testid="AddIcon"]').should('exist')
  })

  it('applies custom className', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        className="custom-class another-class"
      />,
    )

    cy.get('#test-button').should('have.class', 'custom-class')
    cy.get('#test-button').should('have.class', 'another-class')
  })

  it('applies default className when not provided', () => {
    mount(
      <AddObjectButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    cy.get('#test-button').should('have.class', 'button')
    cy.get('#test-button').should('have.class', 'button-white')
  })
})
