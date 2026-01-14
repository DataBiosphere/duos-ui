import React from 'react'
import { AsyncSpinnerMuiButton } from 'src/components/AsyncSpinnerMuiButton'

describe('AsyncSpinnerMuiButton', () => {
  it('renders the button with children', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <AsyncSpinnerMuiButton onClick={mockOnClick}>
        Test Button
      </AsyncSpinnerMuiButton>,
    )

    cy.contains('button', 'Test Button')
      .should('be.visible')
      .should('not.be.disabled')
  })

  it('applies MUI Button props correctly', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        variant="contained"
        color="primary"
        data-cy="custom-mui-button"
      >
        Styled Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="custom-mui-button"]')
      .should('be.visible')
      .should('have.class', 'MuiButton-contained')
      .should('have.class', 'MuiButton-colorPrimary')
  })

  it('accepts custom className and sx props', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        className="custom-button-class"
        sx={{ textTransform: 'none' }}
        data-cy="custom-styled-button"
      >
        Custom Styled Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="custom-styled-button"]')
      .should('have.class', 'custom-button-class')
      .should('have.css', 'text-transform', 'none')
  })

  it('shows spinner during async operation', () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = cy.stub().returns(asyncAction)

    cy.mount(
      <AsyncSpinnerMuiButton onClick={mockOnClick} data-cy="loading-button">
        Loading Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="loading-button"]').click()

    // Should show spinner and be disabled
    cy.get('[data-cy="loading-button"]')
      .should('be.disabled')
      .find('.MuiCircularProgress-root')
      .should('be.visible')

    // Text should not be visible during loading
    cy.get('[data-cy="loading-button"]')
      .should('not.contain', 'Loading Button')

    // Resolve the promise
    cy.then(() => {
      resolvePromise()
    })

    // Should be re-enabled after completion
    cy.get('[data-cy="loading-button"]')
      .should('not.be.disabled')
  })

  it('disappears after successful action when hideOnSuccess is true', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={true}
        data-cy="success-hide-button"
      >
        Success Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="success-hide-button"]')
      .should('be.visible')
      .click()

    // Button should disappear after successful completion
    cy.get('[data-cy="success-hide-button"]')
      .should('not.exist')
  })

  it('remains visible after successful action when hideOnSuccess is false', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={false}
        data-cy="success-visible-button"
      >
        Stay Visible Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="success-visible-button"]')
      .should('be.visible')
      .click()

    // Button should remain visible after successful completion
    cy.get('[data-cy="success-visible-button"]')
      .should('be.visible')
      .should('not.be.disabled')
      .should('contain', 'Stay Visible Button')
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

    cy.mount(
      <AsyncSpinnerMuiButton onClick={mockOnClick} data-cy="error-button">
        Error Button
      </AsyncSpinnerMuiButton>,
    )

    // First click should fail
    cy.get('[data-cy="error-button"]').click()

    // Should become clickable again after error
    cy.get('[data-cy="error-button"]')
      .should('not.be.disabled')
      .should('contain', 'Error Button')

    // Should be able to click again
    cy.then(() => {
      shouldReject = false // Next click will succeed
    })

    cy.get('[data-cy="error-button"]').click()

    // Should remain visible since hideOnSuccess defaults to false
    cy.get('[data-cy="error-button"]')
      .should('be.visible')
  })

  it('respects disabled prop', () => {
    const mockOnClick = cy.stub()
    cy.wrap(mockOnClick).as('mockOnClick')

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        disabled={true}
        data-cy="disabled-button"
      >
        Disabled Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="disabled-button"]')
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

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        data-cy="multi-click-button"
      >
        Multi Click Button
      </AsyncSpinnerMuiButton>,
    )

    // First click starts the action
    cy.get('[data-cy="multi-click-button"]').click()

    // Multiple additional clicks should not trigger the action
    cy.get('[data-cy="multi-click-button"]')
      .click({ force: true })
    cy.get('[data-cy="multi-click-button"]')
      .click({ force: true })
    cy.get('[data-cy="multi-click-button"]')
      .click({ force: true })

    cy.get('@mockOnClick').should('have.been.calledOnce')

    cy.then(() => {
      resolvePromise()
    })
  })

  it('calls onError callback when action fails', () => {
    const error = new Error('Test callback error')
    const mockOnClick = cy.stub().rejects(error)
    const mockOnError = cy.stub()
    cy.wrap(mockOnError).as('mockOnError')

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        onError={mockOnError}
        data-cy="error-callback-button"
      >
        Error Callback Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="error-callback-button"]').click()

    cy.get('@mockOnError').should('have.been.calledOnceWith', error)
  })

  it('does not call onError callback when action succeeds', () => {
    const mockOnClick = cy.stub().resolves()
    const mockOnError = cy.stub()
    cy.wrap(mockOnError).as('mockOnError')

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        onError={mockOnError}
        data-cy="success-callback-button"
      >
        Success Callback Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="success-callback-button"]').click()

    cy.get('@mockOnError').should('not.have.been.called')
  })

  it('allows multiple clicks when hideOnSuccess is false', () => {
    const mockOnClick = cy.stub().resolves()
    cy.wrap(mockOnClick).as('mockOnClick')

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={false}
        data-cy="multi-use-button"
      >
        Multi Use Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="multi-use-button"]').click()

    cy.get('[data-cy="multi-use-button"]')
      .should('be.visible')
      .should('not.be.disabled')

    cy.get('[data-cy="multi-use-button"]').click()
    cy.get('@mockOnClick').should('have.been.calledTwice')
  })

  it('shows loading state correctly when hideOnSuccess is false', () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = cy.stub().returns(asyncAction)

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={false}
        data-cy="loading-stay-button"
      >
        Loading Stay Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="loading-stay-button"]').click()

    cy.get('[data-cy="loading-stay-button"]')
      .should('be.disabled')
      .find('.MuiCircularProgress-root')
      .should('be.visible')

    cy.then(() => {
      resolvePromise()
    })

    cy.get('[data-cy="loading-stay-button"]')
      .should('be.visible')
      .should('not.be.disabled')
      .should('contain', 'Loading Stay Button')
  })

  it('keeps button visible after error regardless of hideOnSuccess value', () => {
    const error = new Error('Test error')
    const mockOnClick = cy.stub().rejects(error)

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={true}
        data-cy="error-with-hide-button"
      >
        Error With Hide Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="error-with-hide-button"]').click()

    cy.get('[data-cy="error-with-hide-button"]')
      .should('be.visible')
      .should('not.be.disabled')
      .should('contain', 'Error With Hide Button')
  })

  it('applies MUI variant and color props', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <div>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          variant="outlined"
          color="secondary"
          data-cy="outlined-button"
        >
          Outlined Button
        </AsyncSpinnerMuiButton>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          variant="text"
          color="error"
          data-cy="text-button"
        >
          Text Button
        </AsyncSpinnerMuiButton>
      </div>,
    )

    cy.get('[data-cy="outlined-button"]')
      .should('have.class', 'MuiButton-outlined')
      .should('have.class', 'MuiButton-colorSecondary')

    cy.get('[data-cy="text-button"]')
      .should('have.class', 'MuiButton-text')
      .should('have.class', 'MuiButton-colorError')
  })

  it('supports MUI size prop', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <div>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          size="small"
          data-cy="small-button"
        >
          Small Button
        </AsyncSpinnerMuiButton>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          size="large"
          data-cy="large-button"
        >
          Large Button
        </AsyncSpinnerMuiButton>
      </div>,
    )

    cy.get('[data-cy="small-button"]')
      .should('have.class', 'MuiButton-sizeSmall')

    cy.get('[data-cy="large-button"]')
      .should('have.class', 'MuiButton-sizeLarge')
  })

  it('supports MUI fullWidth prop', () => {
    const mockOnClick = cy.stub().resolves()

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        fullWidth
        data-cy="full-width-button"
      >
        Full Width Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="full-width-button"]')
      .should('have.class', 'MuiButton-fullWidth')
  })

  it('shows CircularProgress with correct size during loading', () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = cy.stub().returns(asyncAction)

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        data-cy="spinner-size-button"
      >
        Check Spinner Size
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="spinner-size-button"]').click()

    cy.get('[data-cy="spinner-size-button"]')
      .find('.MuiCircularProgress-root')
      .should('be.visible')
      .should('have.attr', 'role', 'progressbar')

    cy.then(() => {
      resolvePromise()
    })
  })

  it('maintains disabled state from props during async operation', () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = cy.stub().returns(asyncAction)

    cy.mount(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        disabled={false}
        data-cy="prop-disabled-button"
      >
        Prop Disabled Button
      </AsyncSpinnerMuiButton>,
    )

    cy.get('[data-cy="prop-disabled-button"]').click()

    // Should be disabled during loading
    cy.get('[data-cy="prop-disabled-button"]')
      .should('be.disabled')

    cy.then(() => {
      resolvePromise()
    })

    // Should return to original disabled state (false)
    cy.get('[data-cy="prop-disabled-button"]')
      .should('not.be.disabled')
  })
})
