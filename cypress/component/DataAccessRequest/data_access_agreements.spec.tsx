import React from 'react'
import { DataAccessAgreements } from 'src/pages/dar_application/DataAccessAgreements'
import { DAA } from 'src/libs/ajax/DAA'

describe('DataAccessAgreements Component Tests', () => {
  let saveSpy: () => void
  let attestSpy: () => void
  let cancelAttestSpy: () => void
  let onDaaIdsChangeSpy
  let getDaasStub

  const mountComponent = (customProps = {}) => {
    const defaultProps = {
      save: saveSpy,
      attest: attestSpy,
      isDraft: true,
      isAttested: false,
      cancelAttest: cancelAttestSpy,
      onDaaIdsChange: onDaaIdsChangeSpy,
      datasets: [],
      ...customProps,
    }
    return cy.mount(<DataAccessAgreements {...defaultProps} />)
  }

  beforeEach(() => {
    cy.initApplicationConfig()
    saveSpy = cy.stub().as('saveSpy')
    attestSpy = cy.stub().as('attestSpy')
    cancelAttestSpy = cy.stub().as('cancelAttestSpy')
    onDaaIdsChangeSpy = cy.stub().as('onDaaIdsChangeSpy')
    getDaasStub = cy.stub(DAA, 'getDaas').returns([])
    mountComponent()
  })

  it('emits displayed DAA ids based on selected datasets', () => {
    getDaasStub.resolves([
      {
        daaId: 100,
        createUserId: 1,
        createDate: 1,
        dacs: [{ dacId: 2, dacName: 'DAC 2', dacEmail: 'dac2@test.com' }],
        file: { fileStorageObjectId: 1, entityId: '1', fileName: 'SharedDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
      },
      {
        daaId: 101,
        createUserId: 1,
        createDate: 1,
        dacs: [{ dacId: 3, dacName: 'DAC 3', dacEmail: 'dac3@test.com' }],
        file: { fileStorageObjectId: 2, entityId: '2', fileName: 'UniqueDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
      },
    ])

    mountComponent({
      datasets: [
        { dataSetId: 1, datasetId: 1, dacId: 2 },
        { dataSetId: 2, datasetId: 2, dacId: 3 },
      ],
    })

    cy.get('@onDaaIdsChangeSpy').should('have.been.calledWith', [100, 101])
  })

  it('renders the component with default props', () => {
    cy.get('.dar-step-card').should('exist')
    cy.get('[data-cy="attest-button"]').should('exist')
    cy.get('[data-cy="save-button"]').should('exist')
  })

  it('renders data access request agreement text for RequiredDAAs', () => {
    getDaasStub.resolves([
      {
        daaId: 100,
        createUserId: 1,
        createDate: 1,
        dacs: [{ dacId: 2, dacName: 'Test DAC', dacEmail: 'dac@test.com' }],
        file: { fileStorageObjectId: 1, entityId: '1', fileName: 'TestDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
      },
    ])

    mountComponent({
      datasets: [{ dataSetId: 1, datasetId: 1, dacId: 2 }],
    })

    cy.contains('By submitting this data access request and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below.').should('exist')
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
