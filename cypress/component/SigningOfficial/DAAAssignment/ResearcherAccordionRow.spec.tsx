import React from 'react'
import ResearcherAccordionRow from 'src/pages/signing_official_console/DAAAssignment/ResearcherAccordionRow'
import { DuosUser } from 'src/types/model'
import { DAARowData } from 'src/pages/signing_official_console/DAAAssignment/types'
import { makeDaa, makeResearcher } from './fixtures'

const mockResearcher: DuosUser = makeResearcher({
  userId: 42,
  displayName: 'Test User Gamma',
  email: 'test.user.gamma@test.org',
  authorizedDaaIds: [1],
})

const mockDaaRows: DAARowData[] = [
  {
    daa: makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA' }),
    dacName: 'NHGRI DAC',
    status: 'authorized',
  },
  {
    daa: makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Agreement' }),
    dacName: 'GTEx DAC',
    status: 'not_requested',
  },
]

describe('ResearcherAccordionRow', () => {
  let authorizeSpy: (daaId: number) => void
  let revokeSpy: (daaId: number) => void
  let toggleSpy: () => void

  beforeEach(() => {
    cy.viewport(600, 300)
    authorizeSpy = cy.stub()
    revokeSpy = cy.stub()
    toggleSpy = cy.stub().as('toggle')
  })

  it('renders the researcher name and email', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-row-42"]').should('contain.text', 'Test User Gamma')
    cy.get('[data-cy="researcher-row-42"]').should('contain.text', 'test.user.gamma@test.org')
  })

  it('shows authorized badge when authorizedCount > 0', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
        authorizedCount={1}
        isExpanded={false}
        onToggle={toggleSpy}
        onAuthorize={authorizeSpy}
        onRevoke={revokeSpy}
      />,
    )
    cy.get('[data-cy="researcher-authorized-badge-42"]').should('contain.text', '1 pre-authorized')
  })

  it('shows no pre-auth status when authorizedCount is 0', () => {
    cy.mount(
      <ResearcherAccordionRow
        researcher={mockResearcher}
        daaRows={mockDaaRows}
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
