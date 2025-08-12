import { mount } from 'cypress/react'
import React from 'react'
import { AsyncActionButton } from 'src/components/AsyncActionButton'

describe('AsyncActionButton', () => {
  it('renders the button with default styling', () => {
    const mockOnClick = cy.stub().resolves()

    mount(
      <AsyncActionButton onClick={mockOnClick}>
        Test Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-test-button"]')
      .should('be.visible')
      .should('contain', 'Test Button')
      .should('have.attr', 'aria-label', 'Test Button')
      .should('not.be.disabled')
  })

  it('applies custom style and className', () => {
    const mockOnClick = cy.stub().resolves()
    const customStyle = { backgroundColor: 'red', color: 'white' }

    mount(
      <AsyncActionButton
        onClick={mockOnClick}
        style={customStyle}
        className="custom-button-class"
      >
        Styled Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-styled-button"]')
      .should('have.class', 'custom-button-class')
      .should('have.css', 'background-color', 'rgb(255, 0, 0)')
      .should('have.css', 'color', 'rgb(255, 255, 255)')
  })

  it('accepts custom data-cy and aria-label attributes', () => {
    const mockOnClick = cy.stub().resolves()

    mount(
      <AsyncActionButton
        onClick={mockOnClick}
        data-cy="custom-test-id"
        aria-label="Custom accessible label"
      >
        Custom Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="custom-test-id"]')
      .should('be.visible')
      .should('have.attr', 'aria-label', 'Custom accessible label')
  })

  it('shows spinner and becomes disabled during async operation', () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = cy.stub().returns(asyncAction)

    mount(
      <AsyncActionButton onClick={mockOnClick}>
        Loading Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-loading-button"]').click()

    // Should show spinner and be disabled
    cy.get('[data-cy="async-action-button-loading-button"]')
      .should('be.disabled')
      .should('have.attr', 'aria-busy', 'true')
      .find('img[alt="spinner"]')
      .should('be.visible')

    // Text should not be visible during loading
    cy.get('[data-cy="async-action-button-loading-button"]')
      .should('not.contain', 'Loading Button')

    // Resolve the promise
    cy.then(() => {
      resolvePromise()
    })
  })

  it('disappears after successful action completion', () => {
    const mockOnClick = cy.stub().resolves()

    mount(
      <AsyncActionButton onClick={mockOnClick}>
        Success Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-success-button"]')
      .should('be.visible')
      .click()

    // Button should disappear after successful completion
    cy.get('[data-cy="async-action-button-success-button"]')
      .should('not.exist')
  })

  it('becomes clickable again after action failure', () => {
    const error = new Error('Test error')
    let shouldReject = true
    const mockOnClick = cy.stub().callsFake(() => {
      if (shouldReject) {
        return Promise.reject(error)
      }
      return Promise.resolve()
    })

    mount(
      <AsyncActionButton onClick={mockOnClick}>
        Error Button
      </AsyncActionButton>,
    )

    // First click should fail
    cy.get('[data-cy="async-action-button-error-button"]').click()

    // Should become clickable again after error
    cy.get('[data-cy="async-action-button-error-button"]')
      .should('not.be.disabled')
      .should('have.attr', 'aria-busy', 'false')
      .should('contain', 'Error Button')

    // Should be able to click again
    cy.then(() => {
      shouldReject = false // Next click will succeed
    })

    cy.get('[data-cy="async-action-button-error-button"]').click()

    // Should disappear on successful retry
    cy.get('[data-cy="async-action-button-error-button"]')
      .should('not.exist')
  })

  it('respects disabled prop', () => {
    const mockOnClick = cy.stub()
    cy.wrap(mockOnClick).as('mockOnClick')

    mount(
      <AsyncActionButton onClick={mockOnClick} disabled={true}>
        Disabled Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-disabled-button"]')
      .should('be.disabled')
      .click({ force: true }) // Force click since it's disabled

    cy.get('@mockOnClick').should('not.have.been.called')
  })

  it('prevents multiple clicks during loading state', () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = cy.stub().returns(asyncAction)
    cy.wrap(mockOnClick).as('mockOnClick')

    mount(
      <AsyncActionButton onClick={mockOnClick}>
        Multi Click Button
      </AsyncActionButton>,
    )

    // First click starts the action
    cy.get('[data-cy="async-action-button-multi-click-button"]').click()

    // Multiple additional clicks should not trigger the action
    cy.get('[data-cy="async-action-button-multi-click-button"]')
      .click({ force: true })
    cy.get('[data-cy="async-action-button-multi-click-button"]')
      .click({ force: true })
    cy.get('[data-cy="async-action-button-multi-click-button"]')
      .click({ force: true })

    cy.get('@mockOnClick').should('have.been.calledOnce')
    cy.then(() => {
      resolvePromise()
    })
  })

  it('handles accessibility attributes correctly', () => {
    const mockOnClick = cy.stub().resolves()

    mount(
      <AsyncActionButton
        onClick={mockOnClick}
        id="accessible-button"
        aria-label="Accessible action button"
      >
        Accessible Button
      </AsyncActionButton>,
    )

    cy.get('#accessible-button')
      .should('have.attr', 'type', 'button')
      .should('have.attr', 'aria-label', 'Accessible action button')
      .should('have.attr', 'aria-busy', 'false')
      .should('have.attr', 'role', 'button')
  })

  it('calls onError callback when action fails', () => {
    const error = new Error('Test callback error')
    const mockOnClick = cy.stub().rejects(error)
    const mockOnError = cy.stub()
    cy.wrap(mockOnError).as('mockOnError')

    mount(
      <AsyncActionButton onClick={mockOnClick} onError={mockOnError}>
        Error Callback Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-error-callback-button"]').click()

    cy.get('@mockOnError').should('have.been.calledOnceWith', error)
  })

  it('does not call onError callback when action succeeds', () => {
    const mockOnClick = cy.stub().resolves()
    const mockOnError = cy.stub()
    cy.wrap(mockOnError).as('mockOnError')

    mount(
      <AsyncActionButton onClick={mockOnClick} onError={mockOnError}>
        Success Callback Button
      </AsyncActionButton>,
    )

    cy.get('[data-cy="async-action-button-success-callback-button"]').click()

    cy.get('@mockOnError').should('not.have.been.called')
  })
})
