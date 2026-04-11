import React from 'react'
import AuthActionButton from 'src/pages/signing_official_console/DAAAssignment/AuthActionButton'
import { AuthStatus } from 'src/pages/signing_official_console/DAAAssignment/types'

describe('AuthActionButton', () => {
  let authorizeSpy: () => void
  let revokeSpy: () => void

  const mountButton = (status: AuthStatus, disabled = false) =>
    cy.mount(
      <AuthActionButton
        status={status}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
        disabled={disabled}
      />,
    )

  beforeEach(() => {
    cy.viewport(600, 300)
    authorizeSpy = cy.stub().as('authorize')
    revokeSpy = cy.stub().as('revoke')
  })

  const renderCases = [
    { status: 'not_requested' as const, selector: 'auth-action-authorize', text: 'Pre-Authorize' },
    { status: 'authorized' as const, selector: 'auth-action-revoke', text: 'Revoke' },
    { status: 'revoked' as const, selector: 'auth-action-reauthorize', text: 'Re-authorize' },
  ]

  renderCases.forEach(({ status, selector, text }) => {
    it(`renders expected action for ${status} status`, () => {
      mountButton(status)
      cy.get(`[data-cy="${selector}"]`).should('exist').and('contain.text', text)
    })
  })

  it('calls onAuthorize when Authorize is clicked', () => {
    mountButton('not_requested')
    cy.get('[data-cy="auth-action-authorize"]').click()
    cy.get('@authorize').should('have.been.calledOnce')
    cy.get('@revoke').should('not.have.been.called')
  })

  it('calls onRevoke when Revoke is clicked', () => {
    mountButton('authorized')
    cy.get('[data-cy="auth-action-revoke"]').click()
    cy.get('@revoke').should('have.been.calledOnce')
    cy.get('@authorize').should('not.have.been.called')
  })

  it('disables the button when disabled prop is true', () => {
    mountButton('not_requested', true)
    cy.get('[data-cy="auth-action-authorize"]').should('be.disabled')
  })
})
