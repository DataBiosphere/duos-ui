import React from 'react'
import ResearcherAccordionRow from 'src/pages/signing_official_console/ResearcherView/ResearcherAccordionRow'
import { DuosUser } from 'src/types/model'
import { DAARowData } from 'src/pages/signing_official_console/ResearcherView/types'
import { DAAObject } from 'src/types/model'

const mockResearcher: DuosUser = {
  userId: 42,
  displayName: 'Dr. Amanda Lee',
  email: 'alee@broadinstitute.org',
  createDate: new Date('2020-01-01') as unknown as Date,
  emailPreference: true,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
  libraryCard: {
    id: 10,
    userId: 42,
    userName: 'Dr. Amanda Lee',
    userEmail: 'alee@broadinstitute.org',
    createDate: new Date('2023-01-01'),
    createUserId: 1,
    daaIds: [1],
  },
}

const makeDaa = (daaId: number, fileName: string): DAAObject => ({
  daaId,
  createUserId: 1,
  createDate: '2024-01-15',
  updateUserId: 1,
  updateDate: '2024-01-15',
  initialDacId: 10,
  file: {
    fileStorageObjectId: daaId,
    entityId: `entity-${daaId}`,
    fileName,
    category: 'dataAccessAgreement',
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1705276800,
  },
  dacs: [],
})

const mockDaaRows: DAARowData[] = [
  { daa: makeDaa(1, 'Default DUOS DAA'), dacName: 'NHGRI DAC', status: 'authorized' },
  { daa: makeDaa(2, 'GTEx Agreement'), dacName: 'GTEx DAC', status: 'not_requested' },
]

describe('ResearcherAccordionRow', () => {
  let authorizeSpy: (daaId: number) => void
  let revokeSpy: (daaId: number) => void
  let toggleSpy: () => void

  beforeEach(() => {
    authorizeSpy = cy.stub().as('authorize')
    revokeSpy = cy.stub().as('revoke')
    toggleSpy = cy.stub().as('toggle')
  })

  it('renders the researcher name and email', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={0}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-row-42"]').should('contain.text', 'Dr. Amanda Lee')
    cy.get('[data-cy="researcher-row-42"]').should('contain.text', 'alee@broadinstitute.org')
  })

  it('shows authorized badge when authorizedCount > 0', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={0}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-authorized-badge-42"]').should('contain.text', '1 authorized')
  })

  it('shows pending badge when pendingCount > 0', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={2}
        authorizedCount={0}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-pending-badge-42"]').should('contain.text', '2 pending')
  })

  it('shows no pre-auth status when both counts are 0', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={0}
        authorizedCount={0}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-no-status-42"]').should('contain.text', 'No pre-auth status')
  })

  it('calls onToggle when the header is clicked', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={0}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-row-toggle-42"]').click()
    cy.get('@toggle').should('have.been.calledOnce')
  })

  it('does not render the DAA subtable when collapsed', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={0}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-subtable"]').should('not.exist')
  })

  it('renders the DAA subtable when expanded', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        pendingCount={0}
        authorizedCount={1}
        isExpanded={true}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-subtable"]').should('exist')
    cy.get('[data-cy="daa-row-1"]').should('exist')
    cy.get('[data-cy="daa-row-2"]').should('exist')
  })
})
