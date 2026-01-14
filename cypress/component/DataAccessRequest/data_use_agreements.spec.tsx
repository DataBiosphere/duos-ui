import React from 'react'
import { DataUseAgreements, DataUseAgreementsProps } from 'src/pages/dar_application/DataUseAgreements'

describe('DataUseAgreements Component Tests', () => {
  let saveSpy: () => void
  let attestSpy: () => void
  let cancelAttestSpy: () => void

  const mountComponent = (customProps = {}) => {
    const defaultProps = {
      save: saveSpy,
      attest: attestSpy,
      isDraft: true,
      isAttested: false,
      cancelAttest: cancelAttestSpy,
      ...customProps,
    } as DataUseAgreementsProps
    return cy.mount(<DataUseAgreements {...defaultProps} />)
  }

  beforeEach(() => {
    cy.initApplicationConfig()
    saveSpy = cy.stub().as('saveSpy')
    attestSpy = cy.stub().as('attestSpy')
    cancelAttestSpy = cy.stub().as('cancelAttestSpy')
    mountComponent()
  })

  it('renders the component with default props', () => {
    cy.get('[data-cy="data-use-agreements"]').should('exist')
    cy.get('[data-cy="broad-library-card"]').should('exist')
    cy.get('[data-cy="nih-library-card"]').should('exist')
    cy.get('[data-cy="nih-certification-agreement"]').should('exist')
    cy.get('[data-cy="attest-button"]').should('exist')
    cy.get('[data-cy="save-button"]').should('exist')
  })

  it('calls save when the save button is clicked', () => {
    cy.get('[data-cy="save-button"]').click()
    cy.get('@saveSpy').should('have.been.called')
  })

  it('calls attest when the attest button is clicked', () => {
    cy.get('[data-cy="attest-button"]').click()
    cy.get('@attestSpy').should('have.been.called')
  })

  it('calls cancelAttest when the cancel attest button is clicked', () => {
    mountComponent({ isAttested: true })
    cy.get('[data-cy="cancel-button"]').should('exist')
    cy.get('[data-cy="cancel-button"]').click()
    cy.get('@cancelAttestSpy').should('have.been.called')
  })
})
