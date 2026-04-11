import React from 'react'
import DAAAccordionRow from 'src/pages/signing_official_console/DAAAssignment/DAAAccordionRow'
import { DAAResearcherRowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { DAAObject, DuosUser } from 'src/types/model'

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

const mockDaa: DAAObject = {
  broadDaa: false,
  daaId: 5,
  createUserId: 1,
  createDate: '2024-03-01',
  updateUserId: 1,
  updateDate: '2024-03-01',
  initialDacId: 10,
  file: {
    fileStorageObjectId: 5,
    entityId: 'entity-5',
    fileName: 'Default DUOS DAA',
    category: 'dataAccessAgreement',
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1709251200,
  },
  dacs: [{ dacId: 10, name: 'NHGRI DAC' }],
}

const recentDaa: DAAObject = {
  ...mockDaa,
  daaId: 6,
  updateDate: new Date().toISOString(), // today — always recent
  file: { ...mockDaa.file!, fileStorageObjectId: 6, fileName: 'Updated Agreement' },
}

const mockDaaWithEpochCreateDate: DAAObject = {
  ...mockDaa,
  daaId: 7,
  createDate: 1709251200 as unknown as string,
  file: { ...mockDaa.file!, fileStorageObjectId: 7, fileName: 'Epoch DAA' },
}

const mockRows: DAAResearcherRowData[] = [
  { researcher: makeResearcher(1, 'Test User Lambda', 'test.user.lambda@test.org'), status: 'authorized' },
  { researcher: makeResearcher(2, 'Test User Mu', 'test.user.mu@test.org'), status: 'not_requested' },
]

describe('DAAAccordionRow', () => {
  let authorizeSpy: (id: number) => void
  let revokeSpy: (id: number) => void
  let toggleSpy: () => void

  beforeEach(() => {
    authorizeSpy = cy.stub()
    revokeSpy = cy.stub()
    toggleSpy = cy.stub().as('toggle')
  })

  it('renders the DAA name and DAC name', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-accordion-row-5"]').should('contain.text', 'Default DUOS DAA')
    cy.get('[data-cy="daa-accordion-row-5"]').should('contain.text', 'NHGRI DAC')
  })

  it('shows the authorized count badge when authorizedCount > 0', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-authorized-badge-5"]').should('contain.text', '1 pre-authorized')
  })

  it('formats epoch effective date as yyyy-mm-dd in the header', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaaWithEpochCreateDate}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={0}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-accordion-row-7"]').should('contain.text', 'Effective 2024-03-01')
    cy.get('[data-cy="daa-accordion-row-7"]').should('not.contain.text', '1709251200')
  })

  it('does not show authorized badge when authorizedCount is 0', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={0}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-authorized-badge-5"]').should('not.exist')
  })

  it('does not show Recently Updated chip when isRecentlyUpdated is false', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-recently-updated-chip-5"]').should('not.exist')
  })

  it('shows the Recently Updated chip when isRecentlyUpdated is true', () => {
    cy.mount(
      <DAAAccordionRow
        daa={recentDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={0}
        isRecentlyUpdated={true}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-recently-updated-chip-6"]').should('exist')
  })

  it('calls onToggle when the header is clicked', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-accordion-toggle-5"]').click()
    cy.get('@toggle').should('have.been.calledOnce')
  })

  it('does not render the researcher subtable when collapsed', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-subtable"]').should('not.exist')
  })

  it('renders the researcher subtable when expanded', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={true}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-researcher-subtable"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-1"]').should('exist')
    cy.get('[data-cy="daa-researcher-row-2"]').should('exist')
  })

  it('shows the recently-updated warning banner inside expanded content', () => {
    cy.mount(
      <DAAAccordionRow
        daa={recentDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={0}
        isRecentlyUpdated={true}
        isExpanded={true}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-recently-updated-banner-6"]').should('exist')
  })

  it('does not show the warning banner when not recently updated', () => {
    cy.mount(
      <DAAAccordionRow
        daa={mockDaa}
        dacName="NHGRI DAC"
        researcherRows={mockRows}
        authorizedCount={1}
        isRecentlyUpdated={false}
        isExpanded={true}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="daa-recently-updated-banner-5"]').should('not.exist')
  })
})
