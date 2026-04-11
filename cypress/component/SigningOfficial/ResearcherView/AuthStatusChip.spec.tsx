import React from 'react'
import AuthStatusChip from 'src/pages/signing_official_console/ResearcherView/AuthStatusChip'

describe('AuthStatusChip', () => {
  const cases = [
    { status: 'authorized' as const, label: 'Pre-Authorized' },
    { status: 'not_requested' as const, label: 'Not Pre-Authorized' },
    { status: 'revoked' as const, label: 'Revoked' },
  ]

  cases.forEach(({ status, label }) => {
    it(`renders ${label} status`, () => {
      cy.mount(<AuthStatusChip status={status} />)
      cy.get(`[data-cy="auth-status-chip-${status}"]`).should('exist')
      cy.get(`[data-cy="auth-status-chip-${status}"]`).should('contain.text', label)
    })
  })
})
