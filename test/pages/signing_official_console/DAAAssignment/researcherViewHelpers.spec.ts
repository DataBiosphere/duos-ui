import { describe, it, expect } from 'vitest'
import {
  buildDAARows,
  buildDAAResearcherRows,
  getAuthStatus,
  getAuthorizedBy,
} from 'src/pages/signing_official_console/DAAAssignment/researcherViewHelpers'
import { makeDaa, makeResearcher } from './fixtures'

describe('researcherViewHelpers', () => {
  describe('getAuthStatus', () => {
    it('treats numeric and string ids as authorized (legacy daaIds)', () => {
      const researcher = makeResearcher({ userId: 10, displayName: 'Test User', email: 'test@duos.org' })
      researcher.libraryCard!.daaIds = [1, '2'] as unknown as number[]
      expect(getAuthStatus(researcher, 1)).toBe('authorized')
      expect(getAuthStatus(researcher, 2)).toBe('authorized')
    })

    it('returns not_requested for unknown ids (legacy daaIds)', () => {
      const researcher = makeResearcher({ userId: 10, displayName: 'Test User', email: 'test@duos.org' })
      researcher.libraryCard!.daaIds = [1]
      expect(getAuthStatus(researcher, 99)).toBe('not_requested')
    })

    it('returns authorized when daaId is present in daaDetails', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1, authorizedBy: 'so@example.org' }, { daaId: 2 }],
      })
      expect(getAuthStatus(researcher, 1)).toBe('authorized')
      expect(getAuthStatus(researcher, 2)).toBe('authorized')
    })

    it('returns not_requested when daaId is absent from daaDetails', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1 }],
      })
      expect(getAuthStatus(researcher, 99)).toBe('not_requested')
    })

    it('prefers daaDetails over legacy daaIds when both are present', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1 }],
      })
      if (researcher.libraryCard) {
        researcher.libraryCard.daaIds = [99]
      }
      expect(getAuthStatus(researcher, 1)).toBe('authorized')
      expect(getAuthStatus(researcher, 99)).toBe('not_requested')
    })
  })

  describe('getAuthorizedBy', () => {
    it('returns the authorizedBy email when the field is populated', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1, authorizedBy: 'so@test.org' }],
      })
      expect(getAuthorizedBy(researcher, 1)).toBe('so@test.org')
    })

    it('returns undefined when the daaDetails entry has no authorizedBy', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1 }],
      })
      expect(getAuthorizedBy(researcher, 1)).toBeUndefined()
    })

    it('returns undefined when the daaId is not present in daaDetails', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 1, authorizedBy: 'so@example.org' }],
      })
      expect(getAuthorizedBy(researcher, 99)).toBeUndefined()
    })

    it('returns undefined when the library card only has legacy daaIds', () => {
      const researcher = makeResearcher({ userId: 10, displayName: 'Test User', email: 'test@duos.org' })
      researcher.libraryCard!.daaIds = [1]
      expect(getAuthorizedBy(researcher, 1)).toBeUndefined()
    })

    it('returns undefined when the library card is absent', () => {
      const researcher = makeResearcher({ userId: 10, displayName: 'Test User', email: 'test@duos.org' })
      delete (researcher as Partial<typeof researcher>).libraryCard
      expect(getAuthorizedBy(researcher, 1)).toBeUndefined()
    })
  })

  describe('buildDAARows', () => {
    it('deduplicates duplicate daaIds', () => {
      const researcher = makeResearcher({ userId: 10, displayName: 'Test User', email: 'test@duos.org' })
      researcher.libraryCard!.daaIds = [1]
      const rows = buildDAARows(researcher, [
        makeDaa({ daaId: 1 }),
        makeDaa({ daaId: 1 }),
        makeDaa({ daaId: 2 }),
      ])
      expect(rows).toHaveLength(2)
      expect(rows.map(row => row.daa.daaId)).toEqual([1, 2])
    })
  })

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
      expect(rows[0].status).toBe('authorized')
      expect(rows[0].authorizedBy).toBe('so@test.org')
    })

    it('leaves authorizedBy undefined when daaDetails entry has no authorizedBy', () => {
      const researcher = makeResearcher({
        userId: 1,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 10 }],
      })
      const rows = buildDAAResearcherRows(daa, [researcher])
      expect(rows[0].authorizedBy).toBeUndefined()
      expect(rows[0].status).toBe('authorized')
    })

    it('leaves authorizedBy undefined when researcher uses legacy daaIds', () => {
      const researcher = makeResearcher({ userId: 1, displayName: 'Test User', email: 'test@duos.org' })
      researcher.libraryCard!.daaIds = [10]
      const rows = buildDAAResearcherRows(daa, [researcher])
      expect(rows[0].authorizedBy).toBeUndefined()
      expect(rows[0].status).toBe('authorized')
    })

    it('leaves authorizedBy undefined when researcher is not authorized', () => {
      const researcher = makeResearcher({
        userId: 1,
        displayName: 'Test User',
        email: 'test@duos.org',
        daaDetails: [{ daaId: 99, authorizedBy: 'so@example.org' }],
      })
      const rows = buildDAAResearcherRows(daa, [researcher])
      expect(rows[0].authorizedBy).toBeUndefined()
      expect(rows[0].status).toBe('not_requested')
    })

    it('returns one row per researcher in the same order', () => {
      const researchers = [
        makeResearcher({ userId: 1, displayName: 'Alice', email: 'alice@example.org', daaDetails: [{ daaId: 10 }] }),
        makeResearcher({ userId: 2, displayName: 'Bob', email: 'bob@example.org' }),
      ]
      const rows = buildDAAResearcherRows(daa, researchers)
      expect(rows).toHaveLength(2)
      expect(rows[0].researcher.userId).toBe(1)
      expect(rows[1].researcher.userId).toBe(2)
    })
  })
})
