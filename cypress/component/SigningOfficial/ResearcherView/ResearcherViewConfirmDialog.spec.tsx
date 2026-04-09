import React from 'react'
import ResearcherViewConfirmDialog from 'src/pages/signing_official_console/ResearcherView/ResearcherViewConfirmDialog'
import { ConfirmDialogState } from 'src/pages/signing_official_console/ResearcherView/types'

describe('ResearcherViewConfirmDialog', () => {
  const mount = (dialog: ConfirmDialogState | null, onConfirm = cy.stub(), onCancel = cy.stub()) =>
    cy.mount(
      <ResearcherViewConfirmDialog
        dialog={dialog}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

  it('does not render when dialog is null', () => {
    mount(null)
    cy.get('[data-cy="confirm-dialog"]').should('not.exist')
  })

  it('renders authorize dialog content', () => {
    mount({
      daaId: 1,
      researcherId: 101,
      researcherName: 'Test User Delta',
      daaLabel: 'Default DUOS DAA',
      action: 'authorize',
    })

    cy.get('[data-cy="confirm-dialog"]').should('exist')
    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Authorize Test User Delta?')
    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Default DUOS DAA')
    cy.get('[data-cy="confirm-dialog-confirm"]').should('contain.text', 'Authorize')
  })

  it('renders revoke dialog content', () => {
    mount({
      daaId: 2,
      researcherId: 102,
      researcherName: 'Test User Epsilon',
      daaLabel: 'GTEx Agreement',
      action: 'revoke',
    })

    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Revoke access for Test User Epsilon?')
    cy.get('[data-cy="confirm-dialog-confirm"]').should('contain.text', 'Revoke Access')
  })

  it('calls cancel and confirm handlers', () => {
    const onConfirm = cy.stub().as('confirm')
    const onCancel = cy.stub().as('cancel')

    mount({
      daaId: 3,
      researcherId: 103,
      researcherName: 'Test User Zeta',
      daaLabel: 'eMERGE DAA',
      action: 'authorize',
    }, onConfirm, onCancel)

    cy.get('[data-cy="confirm-dialog-cancel"]').click()
    cy.get('@cancel').should('have.been.calledOnce')

    cy.get('[data-cy="confirm-dialog-confirm"]').click()
    cy.get('@confirm').should('have.been.calledOnce')
  })
})
