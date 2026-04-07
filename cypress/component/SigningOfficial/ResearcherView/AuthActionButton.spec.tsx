import React from 'react'
import AuthActionButton from 'src/pages/signing_official_console/ResearcherView/AuthActionButton'

describe('AuthActionButton', () => {
  let authorizeSpy: () => void
  let revokeSpy: () => void

  beforeEach(() => {
    cy.viewport(600, 300)
    authorizeSpy = cy.stub().as('authorize')
    revokeSpy = cy.stub().as('revoke')
  })

  it('renders Authorize button for not_requested status', () => {
    cy.mount(
      <AuthActionButton
        status="not_requested"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="auth-action-authorize"]').should('exist').and('contain.text', 'Authorize')
  })

  it('renders Authorize button for pending status', () => {
    cy.mount(
      <AuthActionButton
        status="pending"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="auth-action-authorize"]').should('exist').and('contain.text', 'Authorize')
  })

  it('renders Revoke button for authorized status', () => {
    cy.mount(
      <AuthActionButton
        status="authorized"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="auth-action-revoke"]').should('exist').and('contain.text', 'Revoke')
  })

  it('renders Re-authorize button for revoked status', () => {
    cy.mount(
      <AuthActionButton
        status="revoked"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="auth-action-reauthorize"]').should('exist').and('contain.text', 'Re-authorize')
  })

  it('calls onAuthorize when Authorize is clicked', () => {
    cy.mount(
      <AuthActionButton
        status="not_requested"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="auth-action-authorize"]').click()
    cy.get('@authorize').should('have.been.calledOnce')
    cy.get('@revoke').should('not.have.been.called')
  })

  it('calls onRevoke when Revoke is clicked', () => {
    cy.mount(
      <AuthActionButton
        status="authorized"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="auth-action-revoke"]').click()
    cy.get('@revoke').should('have.been.calledOnce')
    cy.get('@authorize').should('not.have.been.called')
  })

  it('disables the button when disabled prop is true', () => {
    cy.mount(
      <AuthActionButton
        status="not_requested"
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
        disabled={true}
      />,
    )
    cy.get('[data-cy="auth-action-authorize"]').should('be.disabled')
  })
})
