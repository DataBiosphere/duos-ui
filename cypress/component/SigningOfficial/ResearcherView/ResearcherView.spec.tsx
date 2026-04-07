import React from 'react'
import ResearcherView from 'src/pages/signing_official_console/ResearcherView/ResearcherView'
import {
  buildResearcherRows,
  getDacName,
  getAuthStatus,
} from 'src/pages/signing_official_console/ResearcherView/researcherViewHelpers'
import { DAA } from 'src/libs/ajax/DAA'
import { User } from 'src/libs/ajax/User'
import { DuosUser, DAAObject } from 'src/types/model'
import { makeDaa, makeResearcher } from './fixtures'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockDaas: DAAObject[] = [
  makeDaa({ broadDaa: true, daaId: 1, fileName: 'Default DUOS DAA', dacId: 10 }),
  makeDaa({ broadDaa: false, daaId: 2, fileName: 'GTEx Access Agreement', dacId: 20 }),
]

const mockResearchers: DuosUser[] = [
  makeResearcher({
    userId: 1,
    displayName: 'Dr. Elliot Otchet',
    email: 'eotchet@broadinstitute.org',
    authorizedDaaIds: [1],
  }),
  makeResearcher({
    userId: 2,
    displayName: 'Dr. Amanda Lee',
    email: 'alee@broadinstitute.org',
  }),
]

// ── Pure helper unit tests ────────────────────────────────────────────────────

describe('ResearcherView pure helpers', () => {
  beforeEach(() => {
    cy.viewport(600, 300)
  })

  describe('getDacName', () => {
    it('returns the DAC name from daa.dacs', () => {
      const daa = makeDaa({ broadDaa: true, daaId: 1, fileName: 'Test DAA', dacId: 10 })
      expect(getDacName(daa)).to.equal('DAC-10')
    })

    it('returns — when dacs array is empty', () => {
      const daa = { ...makeDaa({ broadDaa: true, daaId: 1, fileName: 'Test DAA', dacId: 10 }), dacs: [] }
      expect(getDacName(daa)).to.equal('—')
    })

    it('joins multiple DAC names', () => {
      const daa: DAAObject = {
        ...makeDaa({ broadDaa: true, daaId: 1, fileName: 'Multi DAA', dacId: 10 }),
        dacs: [
          { dacId: 10, name: 'DAC A' },
          { dacId: 20, name: 'DAC B' },
        ],
      }
      expect(getDacName(daa)).to.equal('DAC A / DAC B')
    })
  })

  describe('getAuthStatus', () => {
    it('returns authorized when daaId is in libraryCard.daaIds', () => {
      const researcher = makeResearcher({ userId: 1, displayName: 'Test', email: 'test@test.com', authorizedDaaIds: [1, 2] })
      expect(getAuthStatus(researcher, 1)).to.equal('authorized')
    })

    it('returns not_requested when daaId is absent from libraryCard', () => {
      const researcher = makeResearcher({ userId: 1, displayName: 'Test', email: 'test@test.com', authorizedDaaIds: [1] })
      expect(getAuthStatus(researcher, 99)).to.equal('not_requested')
    })

    it('returns not_requested when researcher has no libraryCard', () => {
      const researcher = { ...makeResearcher({ userId: 1, displayName: 'Test', email: 'test@test.com' }), libraryCard: undefined }
      expect(getAuthStatus(researcher, 1)).to.equal('not_requested')
    })
  })

  describe('buildResearcherRows', () => {
    it('counts authorized correctly', () => {
      const rows = buildResearcherRows(mockResearchers, mockDaas)
      const elliot = rows.find(r => r.researcher.userId === 1)
      expect(elliot?.authorizedCount).to.equal(1)
    })

    it('counts not_requested as 0 authorized', () => {
      const rows = buildResearcherRows(mockResearchers, mockDaas)
      const amanda = rows.find(r => r.researcher.userId === 2)
      expect(amanda?.authorizedCount).to.equal(0)
    })
  })
})

// ── Component tests ───────────────────────────────────────────────────────────

describe('ResearcherView', () => {
  let refreshSpy: (updated: DuosUser[]) => void

  beforeEach(() => {
    cy.viewport(600, 600)
    cy.initApplicationConfig()
    refreshSpy = cy.stub()
    cy.stub(User, 'list').resolves(mockResearchers)
  })

  const mount = (overrides: Partial<React.ComponentProps<typeof ResearcherView>> = {}) =>
    cy.mount(
      <ResearcherView
        researchers={mockResearchers}
        daas={mockDaas}
        isLoading={false}
        onResearchersRefresh={refreshSpy}
        {...overrides}
      />,
    )

  it('renders a row for each researcher', () => {
    mount()
    cy.get('[data-cy="researcher-list"]').within(() => {
      cy.get('[data-cy="researcher-row-1"], [data-cy="researcher-row-2"]').should('have.length', 2)
    })
  })

  it('shows a loading spinner when isLoading is true', () => {
    mount({ isLoading: true })
    cy.get('[data-cy="researcher-view-loading"]').should('exist')
    cy.get('[data-cy="researcher-view"]').should('not.exist')
  })

  it('filters researchers by name', () => {
    mount()
    cy.get('[data-cy="researcher-search"] input').type('Amanda')
    cy.get('[data-cy="researcher-row-1"]').should('not.exist')
    cy.get('[data-cy="researcher-row-2"]').should('exist')
  })

  it('filters researchers by email', () => {
    mount()
    cy.get('[data-cy="researcher-search"] input').type('eotchet')
    cy.get('[data-cy="researcher-row-1"]').should('exist')
    cy.get('[data-cy="researcher-row-2"]').should('not.exist')
  })

  it('shows empty message when search has no matches', () => {
    mount()
    cy.get('[data-cy="researcher-search"] input').type('xyznotfound')
    cy.get('[data-cy="researcher-empty-message"]').should('exist')
  })

  it('expands all rows when Expand All is clicked', () => {
    mount()
    cy.get('[data-cy="expand-collapse-all"]').click()
    cy.get('[data-cy="daa-subtable"]').should('have.length', 2)
  })

  it('collapses all rows when Collapse All is clicked after expanding', () => {
    mount()
    cy.get('[data-cy="expand-collapse-all"]').click()
    cy.get('[data-cy="expand-collapse-all"]').should('contain.text', 'Collapse All')
    cy.get('[data-cy="expand-collapse-all"]').click()
    cy.get('[data-cy="daa-subtable"]').should('not.exist')
  })

  it('expands a single row when its header is clicked', () => {
    mount()
    cy.get('[data-cy="researcher-row-toggle-1"]').click()
    cy.get('[data-cy="researcher-row-1"] [data-cy="daa-subtable"]').should('exist')
    cy.get('[data-cy="researcher-row-2"] [data-cy="daa-subtable"]').should('not.exist')
  })

  it('opens confirm dialog when Authorize is clicked in an expanded row', () => {
    mount()
    cy.get('[data-cy="researcher-row-toggle-2"]').click()
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]').first().click()
    cy.get('[data-cy="confirm-dialog"]').should('exist')
    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Authorize')
  })

  it('closes the confirm dialog when Cancel is clicked', () => {
    mount()
    cy.get('[data-cy="researcher-row-toggle-2"]').click()
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]').first().click()
    cy.get('[data-cy="confirm-dialog-cancel"]').click()
    cy.get('[data-cy="confirm-dialog"]').should('not.exist')
  })

  it('calls createDaaLcLink and refreshes when Authorize is confirmed', () => {
    cy.stub(DAA, 'createDaaLcLink').resolves()
    mount()
    cy.get('[data-cy="researcher-row-toggle-2"]').click()
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-authorize"]').first().click()
    cy.get('[data-cy="confirm-dialog-confirm"]').click()
    cy.wrap(DAA.createDaaLcLink).should('have.been.calledOnce')
    cy.wrap(User.list).should('have.been.called')
  })

  it('opens revoke confirm dialog when Revoke is clicked', () => {
    mount()
    // Researcher 1 is authorized for DAA 1 → should see Revoke button
    cy.get('[data-cy="researcher-row-toggle-1"]').click()
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]').click()
    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Revoke')
  })

  it('calls deleteDaaLcLink and refreshes when Revoke is confirmed', () => {
    cy.stub(DAA, 'deleteDaaLcLink').resolves()
    mount()
    cy.get('[data-cy="researcher-row-toggle-1"]').click()
    cy.get('[data-cy="daa-row-1"] [data-cy="auth-action-revoke"]').click()
    cy.get('[data-cy="confirm-dialog-confirm"]').click()
    cy.wrap(DAA.deleteDaaLcLink).should('have.been.calledOnce')
    cy.wrap(User.list).should('have.been.called')
  })
})
