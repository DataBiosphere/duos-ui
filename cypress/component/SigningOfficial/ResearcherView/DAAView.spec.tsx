import React from 'react'
import DAAView from 'src/pages/signing_official_console/ResearcherView/DAAView'
import {
  buildDAAViewRows,
  isRecentlyUpdated,
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

const recentDaa = makeDaa({ broadDaa: false, daaId: 3, fileName: 'Recent Agreement', dacId: 30 })
const recentDaaWithDate: DAAObject = {
  ...recentDaa,
  updateDate: new Date().toISOString(), // today — always within the last year
}

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

describe('DAAView pure helpers', () => {
  beforeEach(() => {
    cy.viewport(600, 300)
  })

  describe('isRecentlyUpdated', () => {
    it('returns true when updateDate is within the last year', () => {
      const daa = { ...mockDaas[0], updateDate: new Date().toISOString() }
      expect(isRecentlyUpdated(daa)).to.equal(true)
    })

    it('returns false when updateDate is more than a year ago', () => {
      const daa = { ...mockDaas[0], updateDate: '2020-01-01' }
      expect(isRecentlyUpdated(daa)).to.equal(false)
    })

    it('returns false when updateDate is null/undefined', () => {
      const daa = { ...mockDaas[0], updateDate: undefined }
      expect(isRecentlyUpdated(daa as unknown as DAAObject)).to.equal(false)
    })

    it('returns false when updateDate is not a valid date string', () => {
      const daa = { ...mockDaas[0], updateDate: 'not-a-date' }
      expect(isRecentlyUpdated(daa)).to.equal(false)
    })
  })

  describe('buildDAAViewRows', () => {
    it('returns one row per unique DAA', () => {
      const rows = buildDAAViewRows(mockDaas, mockResearchers)
      expect(rows).to.have.length(2)
    })

    it('deduplicates DAAs with the same daaId', () => {
      const rows = buildDAAViewRows([...mockDaas, mockDaas[0]], mockResearchers)
      expect(rows).to.have.length(2)
    })

    it('counts authorized researchers correctly per DAA', () => {
      const rows = buildDAAViewRows(mockDaas, mockResearchers)
      const row1 = rows.find(r => r.daa.daaId === 1)
      const row2 = rows.find(r => r.daa.daaId === 2)
      // Only researcher 1 is authorized for DAA 1
      expect(row1?.authorizedCount).to.equal(1)
      // No one authorized for DAA 2
      expect(row2?.authorizedCount).to.equal(0)
    })

    it('includes all researchers in each DAA row', () => {
      const rows = buildDAAViewRows(mockDaas, mockResearchers)
      rows.forEach((row) => {
        expect(row.researcherRows).to.have.length(mockResearchers.length)
      })
    })

    it('sets isRecentlyUpdated correctly', () => {
      const daasWithRecent = [...mockDaas, recentDaaWithDate]
      const rows = buildDAAViewRows(daasWithRecent, mockResearchers)
      const oldRow = rows.find(r => r.daa.daaId === 1)
      const recentRow = rows.find(r => r.daa.daaId === 3)
      expect(oldRow?.isRecentlyUpdated).to.equal(false)
      expect(recentRow?.isRecentlyUpdated).to.equal(true)
    })

    it('returns empty array when daas is empty', () => {
      expect(buildDAAViewRows([], mockResearchers)).to.deep.equal([])
    })

    it('returns rows with empty researcherRows when researchers is empty', () => {
      const rows = buildDAAViewRows(mockDaas, [])
      rows.forEach((row) => {
        expect(row.researcherRows).to.have.length(0)
        expect(row.authorizedCount).to.equal(0)
      })
    })
  })
})

// ── Component tests ───────────────────────────────────────────────────────────

describe('DAAView', () => {
  let refreshSpy: (updated: DuosUser[]) => void

  beforeEach(() => {
    cy.viewport(600, 800)
    cy.initApplicationConfig()
    refreshSpy = cy.stub()
    cy.stub(User, 'list').resolves(mockResearchers)
  })

  const mount = (overrides: Partial<React.ComponentProps<typeof DAAView>> = {}) =>
    cy.mount(
      <DAAView
        researchers={mockResearchers}
        daas={mockDaas}
        isLoading={false}
        onResearchersRefresh={refreshSpy}
        {...overrides}
      />,
    )

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders an accordion row for each DAA', () => {
    mount()
    cy.get('[data-cy="daa-accordion-row-1"]').should('exist')
    cy.get('[data-cy="daa-accordion-row-2"]').should('exist')
  })

  it('shows a loading spinner when isLoading is true', () => {
    mount({ isLoading: true })
    cy.get('[data-cy="daa-view-loading"]').should('exist')
    cy.get('[data-cy="daa-view"]').should('not.exist')
  })

  it('shows empty message when there are no DAA rows', () => {
    mount({ daas: [] })
    cy.get('[data-cy="daa-empty-message"]').should('exist')
  })

  it('renders the toolbar with search and expand/collapse controls', () => {
    mount()
    cy.get('[data-cy="daa-view-toolbar"]').should('exist')
    cy.get('[data-cy="daa-search"]').should('exist')
    cy.get('[data-cy="daa-expand-collapse-all"]').should('exist')
  })

  // ── Search / filter ────────────────────────────────────────────────────────

  it('filters rows by DAA filename', () => {
    mount()
    cy.get('[data-cy="daa-search"] input').type('GTEx')
    cy.get('[data-cy="daa-accordion-row-1"]').should('not.exist')
    cy.get('[data-cy="daa-accordion-row-2"]').should('exist')
  })

  it('filters rows by DAC name', () => {
    mount()
    cy.get('[data-cy="daa-search"] input').type('DAC-10')
    cy.get('[data-cy="daa-accordion-row-1"]').should('exist')
    cy.get('[data-cy="daa-accordion-row-2"]').should('not.exist')
  })

  it('shows empty message when search has no matches', () => {
    mount()
    cy.get('[data-cy="daa-search"] input').type('xyznotfound')
    cy.get('[data-cy="daa-empty-message"]').should('exist')
  })

  it('is case-insensitive when filtering', () => {
    mount()
    cy.get('[data-cy="daa-search"] input').type('gtex')
    cy.get('[data-cy="daa-accordion-row-2"]').should('exist')
  })

  // ── Expand / collapse ──────────────────────────────────────────────────────

  it('does not show researcher subtables by default (all collapsed)', () => {
    mount()
    cy.get('[data-cy="daa-researcher-subtable"]').should('not.exist')
  })

  it('expands a single row when its header is clicked', () => {
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    cy.get('[data-cy="daa-accordion-row-1"] [data-cy="daa-researcher-subtable"]').should('exist')
    cy.get('[data-cy="daa-accordion-row-2"] [data-cy="daa-researcher-subtable"]').should('not.exist')
  })

  it('collapses an expanded row when its header is clicked again', () => {
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    cy.get('[data-cy="daa-researcher-subtable"]').should('not.exist')
  })

  it('expands all rows when Expand All is clicked', () => {
    mount()
    cy.get('[data-cy="daa-expand-collapse-all"]').click()
    cy.get('[data-cy="daa-researcher-subtable"]').should('have.length', mockDaas.length)
  })

  it('Expand All button text changes to Collapse All when all are expanded', () => {
    mount()
    cy.get('[data-cy="daa-expand-collapse-all"]').click()
    cy.get('[data-cy="daa-expand-collapse-all"]').should('contain.text', 'Collapse All')
  })

  it('collapses all rows when Collapse All is clicked', () => {
    mount()
    cy.get('[data-cy="daa-expand-collapse-all"]').click()
    cy.get('[data-cy="daa-expand-collapse-all"]').click()
    cy.get('[data-cy="daa-researcher-subtable"]').should('not.exist')
  })

  // ── Confirm dialog — authorize ─────────────────────────────────────────────

  it('opens confirm dialog when Pre-Authorize is clicked for an un-authorized researcher', () => {
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    // Researcher 2 (Amanda) is not authorized for DAA 1
    cy.get('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]').click()
    cy.get('[data-cy="confirm-dialog"]').should('exist')
    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Authorize')
  })

  it('closes the confirm dialog when Cancel is clicked', () => {
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    cy.get('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]').click()
    cy.get('[data-cy="confirm-dialog-cancel"]').click()
    cy.get('[data-cy="confirm-dialog"]').should('not.exist')
  })

  it('calls createDaaLcLink and refreshes when authorize is confirmed', () => {
    cy.stub(DAA, 'createDaaLcLink').resolves()
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    cy.get('[data-cy="daa-researcher-row-2"] [data-cy="auth-action-authorize"]').click()
    cy.get('[data-cy="confirm-dialog-confirm"]').click()
    cy.wrap(DAA.createDaaLcLink).should('have.been.calledWith', 1, 2)
    cy.wrap(User.list).should('have.been.called')
  })

  // ── Confirm dialog — revoke ────────────────────────────────────────────────

  it('opens revoke confirm dialog when Revoke is clicked for an authorized researcher', () => {
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    // Researcher 1 (Elliot) is authorized for DAA 1
    cy.get('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]').click()
    cy.get('[data-cy="confirm-dialog"]').should('exist')
    cy.get('[data-cy="confirm-dialog"]').should('contain.text', 'Revoke')
  })

  it('calls deleteDaaLcLink and refreshes when revoke is confirmed', () => {
    cy.stub(DAA, 'deleteDaaLcLink').resolves()
    mount()
    cy.get('[data-cy="daa-accordion-toggle-1"]').click()
    cy.get('[data-cy="daa-researcher-row-1"] [data-cy="auth-action-revoke"]').click()
    cy.get('[data-cy="confirm-dialog-confirm"]').click()
    cy.wrap(DAA.deleteDaaLcLink).should('have.been.calledWith', 1, 1)
    cy.wrap(User.list).should('have.been.called')
  })
})
