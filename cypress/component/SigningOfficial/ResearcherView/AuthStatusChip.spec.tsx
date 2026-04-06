import React from 'react'
import AuthStatusChip from 'src/pages/signing_official_console/ResearcherView/AuthStatusChip'

describe('AuthStatusChip', () => {
  it('renders Authorized status with green styling', () => {
    cy.mount(<AuthStatusChip status="authorized" />)
    cy.get('[data-cy="auth-status-chip-authorized"]').should('exist')
    cy.get('[data-cy="auth-status-chip-authorized"]').should('contain.text', 'Authorized')
  })

  it('renders Pending status with yellow styling', () => {
    cy.mount(<AuthStatusChip status="pending" />)
    cy.get('[data-cy="auth-status-chip-pending"]').should('exist')
    cy.get('[data-cy="auth-status-chip-pending"]').should('contain.text', 'Pending')
  })

  it('renders Not Requested status with grey styling', () => {
    cy.mount(<AuthStatusChip status="not_requested" />)
    cy.get('[data-cy="auth-status-chip-not_requested"]').should('exist')
    cy.get('[data-cy="auth-status-chip-not_requested"]').should('contain.text', 'Not Requested')
  })

  it('renders Revoked status with red styling', () => {
    cy.mount(<AuthStatusChip status="revoked" />)
    cy.get('[data-cy="auth-status-chip-revoked"]').should('exist')
    cy.get('[data-cy="auth-status-chip-revoked"]').should('contain.text', 'Revoked')
  })
})
