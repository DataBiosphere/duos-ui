import React from 'react'
import DAAResearcherSubtable from 'src/pages/signing_official_console/DAAAssignment/DAAResearcherSubtable'
import { DAAResearcherRowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { DuosUser } from 'src/types/model'

const makeResearcher = (userId: number, displayName: string, email: string): DuosUser => ({
  userId,
  displayName,
  email,
  createDate: new Date('2020-01-01'),
  emailPreference: true,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
})

const mockRows: DAAResearcherRowData[] = [
  {
    researcher: makeResearcher(1, 'Test User Theta', 'test.user.theta@test.org'),
    status: 'authorized',
    authorizedBy: 'so@test.org',
  },
  {
    researcher: makeResearcher(2, 'Test User Iota', 'test.user.iota@test.org'),
    status: 'not_requested',
  },
  {
    researcher: makeResearcher(3, 'Test User Kappa', 'test.user.kappa@test.org'),
    status: 'revoked',
  },
]

describe('DAAResearcherSubtable', () => {
  let authorizeSpy: (id: number) => void
  let revokeSpy: (id: number) => void

  beforeEach(() => {
    authorizeSpy = cy.stub().as('authorize')
    revokeSpy = cy.stub().as('revoke')
  })

  it('renders all researcher rows', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-subtable"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-1"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-2"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-3"]').should('exist')
  })

  it('displays researcher name and email in each row', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-row-1"]').should('contain.text', 'Test User Theta')
    cy.get('[data-cy="daa-researcher-row-1"]').should('contain.text', 'test.user.theta@test.org')
    cy.get('[data-cy="daa-researcher-row-2"]').should('contain.text', 'Test User Iota')
  })

  it('renders the correct status chip for each row', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-row-1"] [data-cy="auth-status-chip-authorized"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-2"] [data-cy="auth-status-chip-not_requested"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-3"] [data-cy="auth-status-chip-revoked"]').should('exist')
  })

  it('renders Revoke button for authorized rows and Pre-Authorize for others', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-3"] [data-cy="auth-action-reauthorize"]').should('exist')
  })

  it('calls onRevoke with the correct researcherId when Revoke is clicked', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]').click()
    cy.get('@revoke').should('have.been.calledWith', 1)
  })

  it('calls onAuthorize with the correct researcherId when Pre-Authorize is clicked', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]').click()
    cy.get('@authorize').should('have.been.calledWith', 2)
  })

  it('shows empty message when no researcher rows provided', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={[]}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-subtable-empty"]').should('exist')
    cy.get('[data-cy^="daa-researcher-row-"]').should('not.exist')
  })

  it('renders all five column headers including Authorized By', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-subtable"]').within(() => {
      cy.contains('Researcher').should('exist')
      cy.contains('Email').should('exist')
      cy.contains('Pre-Auth Status').should('exist')
      cy.contains('Authorized By').should('exist')
      cy.contains('Action').should('exist')
    })
  })

  // ── Authorized By column ───────────────────────────────────────────────────

  it('shows the authorizedBy email when the field is populated', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-authorized-by-1"]').should('contain.text', 'so@test.org')
  })

  it('shows a dash when authorizedBy is not set', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-authorized-by-2"]').should('contain.text', '—')
    cy.get('[data-cy="daa-authorized-by-3"]').should('contain.text', '—')
  })

  it('renders an Authorized By cell for every row', () => {
    cy.mount(
      <DAAResearcherSubtable
        researcherRows={mockRows}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    mockRows.forEach(({ researcher }) => {
      cy.get(`[data-cy="daa-authorized-by-${researcher.userId}"]`).should('exist')
    })
  })
})
