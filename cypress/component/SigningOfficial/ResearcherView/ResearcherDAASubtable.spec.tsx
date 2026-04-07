import React from 'react'
import ResearcherDAASubtable from 'src/pages/signing_official_console/ResearcherView/ResearcherDAASubtable'
import { DAARowData } from 'src/pages/signing_official_console/ResearcherView/types'
import { makeDaa } from './fixtures'

const mockDaaRows: DAARowData[] = [
  {
    daa: makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA' }),
    dacName: 'NHGRI DAC',
    status: 'authorized',
  },
  {
    daa: makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Access Agreement' }),
    dacName: 'GTEx DAC',
    status: 'pending',
  },
  {
    daa: makeDaa({ broadDaa: false, daaId: 3, fileName: 'eMERGE Institutional Agreement' }),
    dacName: 'eMERGE DAC',
    status: 'not_requested',
  },
]

describe('ResearcherDAASubtable', () => {
  let authorizeSpy: (daaId: number) => void
  let revokeSpy: (daaId: number) => void

  beforeEach(() => {
    cy.viewport(600, 300)
    authorizeSpy = cy.stub().as('authorize')
    revokeSpy = cy.stub().as('revoke')
  })

  it('renders all DAA rows', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={mockDaaRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-subtable"]').should('exist')
    cy.get('[data-cy="daa-row-1"]').should('exist')
    cy.get('[data-cy="daa-row-2"]').should('exist')
    cy.get('[data-cy="daa-row-3"]').should('exist')
  })

  it('displays DAA file name, DAC name, and create date in each row', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={mockDaaRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-row-1"]').should('contain.text', 'Default DUOS DAA')
    cy.get('[data-cy="daa-row-1"]').should('contain.text', 'NHGRI DAC')
    cy.get('[data-cy="daa-row-2"]').should('contain.text', 'GTEx Access Agreement')
    cy.get('[data-cy="daa-row-2"]').should('contain.text', 'GTEx DAC')
  })

  it('renders the correct status chip for each row', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={mockDaaRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-status-chip-authorized"]').should('exist')
    cy.get('[data-cy="daa-row-2"] [data-cy="auth-status-chip-pending"]').should('exist')
    cy.get('[data-cy="daa-row-3"] [data-cy="auth-status-chip-not_requested"]').should('exist')
  })

  it('renders Revoke button for authorized row and Authorize button for others', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={mockDaaRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]').should('exist')
    cy.get('[data-cy="daa-row-2"] [data-cy="auth-action-authorize"]').should('exist')
    cy.get('[data-cy="daa-row-3"] [data-cy="auth-action-authorize"]').should('exist')
  })

  it('calls onRevoke with the correct daaId when Revoke is clicked', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={mockDaaRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]').click()
    cy.get('@revoke').should('have.been.calledWith', 1)
  })

  it('calls onAuthorize with the correct daaId when Authorize is clicked', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={mockDaaRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-row-3"] [data-cy="auth-action-authorize"]').click()
    cy.get('@authorize').should('have.been.calledWith', 3)
  })

  it('renders empty table body when no DAA rows provided', () => {
    cy.mount(
      <ResearcherDAASubtable
        daaRows={[]}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-subtable"]').should('exist')
    cy.get('[data-cy^="daa-row-"]').should('not.exist')
  })
})
