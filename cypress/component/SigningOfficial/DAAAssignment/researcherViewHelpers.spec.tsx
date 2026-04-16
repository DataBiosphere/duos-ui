import {
  buildDAARows,
  buildDAAResearcherRows,
  getAuthStatus,
  getAuthorizedBy,
} from 'src/pages/signing_official_console/DAAAssignment/researcherViewHelpers'
import { makeDaa, makeResearcher } from './fixtures'

describe('researcherViewHelpers', () => {
  // ── getAuthStatus ────────────────────────────────────────────────────────────

  describe('getAuthStatus', () => {
    it('treats numeric and string ids as authorized (legacy daaIds)', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
      })
      researcher.libraryCard!.daaIds = [1, '2'] as unknown as number[]
      expect(getAuthStatus(researcher, 1)).to.equal('authorized')
      expect(getAuthStatus(researcher, 2)).to.equal('authorized')
    })

    it('returns not_requested for unknown ids (legacy daaIds)', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
      })
      researcher.libraryCard!.daaIds = [1]
      expect(getAuthStatus(researcher, 99)).to.equal('not_requested')
    })

    it('returns authorized when daaId is present in daaDetails', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1, authorizedBy: 'so@example.org' }, { daaId: 2 }],
      })
      cy.wrap(getAuthStatus(researcher, 1)).should('equal', 'authorized')
      cy.wrap(getAuthStatus(researcher, 2)).should('equal', 'authorized')
    })

    it('returns not_requested when daaId is absent from daaDetails', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1 }],
      })
      cy.wrap(getAuthStatus(researcher, 99)).should('equal', 'not_requested')
    })

    it('prefers daaDetails over legacy daaIds when both are present', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1 }],
      })
      // Override libraryCard to also have the legacy field, simulating a
      // transitional API response.
      if (researcher.libraryCard) {
        researcher.libraryCard.daaIds = [99]
      }
      // daaId 1 is in daaDetails → authorized; daaId 99 is only in daaIds → ignored
      cy.wrap(getAuthStatus(researcher, 1)).should('equal', 'authorized')
      cy.wrap(getAuthStatus(researcher, 99)).should('equal', 'not_requested')
    })
  })

  // ── getAuthorizedBy ──────────────────────────────────────────────────────────

  describe('getAuthorizedBy', () => {
    it('returns the authorizedBy email when the field is populated', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1, authorizedBy: 'so@test.org' }],
      })
      cy.wrap(getAuthorizedBy(researcher, 1)).should('equal', 'so@test.org')
    })

    it('returns undefined when the daaDetails entry has no authorizedBy', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1 }],
      })
      cy.wrap(getAuthorizedBy(researcher, 1)).should('be.undefined')
    })

    it('returns undefined when the daaId is not present in daaDetails', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1, authorizedBy: 'so@example.org' }],
      })
      cy.wrap(getAuthorizedBy(researcher, 99)).should('be.undefined')
    })

    it('returns undefined when the library card only has legacy daaIds', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
      })
      researcher.libraryCard!.daaIds = [1]
      cy.wrap(getAuthorizedBy(researcher, 1)).should('be.undefined')
    })

    it('returns undefined when the library card is absent', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
      })
      delete (researcher as Partial<typeof researcher>).libraryCard
      cy.wrap(getAuthorizedBy(researcher, 1)).should('be.undefined')
    })
  })

  // ── buildDAARows ─────────────────────────────────────────────────────────────

  describe('buildDAARows', () => {
    it('deduplicates duplicate daaIds', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
      })
      researcher.libraryCard!.daaIds = [1]
      const rows = buildDAARows(researcher, [
        makeDaa({ broadDaa: true, daaId: 1 }),
        makeDaa({ broadDaa: false, daaId: 1 }),
        makeDaa({ broadDaa: false, daaId: 2 }),
      ])
      cy.wrap(rows).should('have.length', 2)
      cy.wrap(rows.map(row => row.daa.daaId)).should('deep.equal', [1, 2])
    })
  })

  // ── buildDAAResearcherRows ────────────────────────────────────────────────────

  describe('buildDAAResearcherRows', () => {
    const daa = makeDaa({ daaId: 10 })

    it('populates authorizedBy from daaDetails when present', () => {
      const researcher = makeResearcher({
        userId: 1,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 10, authorizedBy: 'so@test.org' }],
      })
      const rows = buildDAAResearcherRows(daa, [researcher])
      cy.wrap(rows[0].status).should('equal', 'authorized')
      cy.wrap(rows[0].authorizedBy).should('equal', 'so@test.org')
      cy.wrap(rows[0].status).should('equal', 'authorized')
    })

    it('leaves authorizedBy undefined when daaDetails entry has no authorizedBy', () => {
      const researcher = makeResearcher({
        userId: 1,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 10 }],
      })
      const rows = buildDAAResearcherRows(daa, [researcher])
      cy.wrap(rows[0].authorizedBy).should('be.undefined')
      cy.wrap(rows[0].status).should('equal', 'authorized')
    })

    it('leaves authorizedBy undefined when researcher uses legacy daaIds', () => {
      const researcher = makeResearcher({
        userId: 1,
        displayName: 'Test User',
        email: 'test@duos.org',
      })
      researcher.libraryCard!.daaIds = [10]
      const rows = buildDAAResearcherRows(daa, [researcher])
      cy.wrap(rows[0].authorizedBy).should('be.undefined')
      cy.wrap(rows[0].status).should('equal', 'authorized')
    })

    it('leaves authorizedBy undefined when researcher is not authorized', () => {
      const researcher = makeResearcher({
        userId: 1,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 99, authorizedBy: 'so@example.org' }],
      })
      const rows = buildDAAResearcherRows(daa, [researcher])
      cy.wrap(rows[0].authorizedBy).should('be.undefined')
      cy.wrap(rows[0].status).should('equal', 'not_requested')
    })

    it('returns one row per researcher in the same order', () => {
      const researchers = [
        makeResearcher({ userId: 1, displayName: 'Alice', email: 'alice@example.org', daaDetails: [{ daaId: 10 }] }),
        makeResearcher({ userId: 2, displayName: 'Bob', email: 'bob@example.org' }),
      ]
      const rows = buildDAAResearcherRows(daa, researchers)
      cy.wrap(rows).should('have.length', 2)
      cy.wrap(rows[0].researcher.userId).should('equal', 1)
      cy.wrap(rows[1].researcher.userId).should('equal', 2)
    })
  })
})
