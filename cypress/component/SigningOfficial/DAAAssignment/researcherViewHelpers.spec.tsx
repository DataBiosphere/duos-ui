import {
  buildDAARows,
  getAuthStatus,
} from 'src/pages/signing_official_console/DAAAssignment/researcherViewHelpers'
import { makeDaa, makeResearcher } from './fixtures'

describe('researcherViewHelpers', () => {
  describe('getAuthStatus', () => {
    it('treats numeric and string ids as authorized', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        authorizedDaaIds: [1, '2'] as unknown[],
      })
      expect(getAuthStatus(researcher, 1)).to.equal('authorized')
      expect(getAuthStatus(researcher, 2)).to.equal('authorized')
    })

    it('supports comma separated id strings and object ids', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        authorizedDaaIds: ['3,4', { daaId: 5 }, { id: 6 }, { value: 7 }] as unknown[],
      })
      expect(getAuthStatus(researcher, 3)).to.equal('authorized')
      expect(getAuthStatus(researcher, 4)).to.equal('authorized')
      expect(getAuthStatus(researcher, 5)).to.equal('authorized')
      expect(getAuthStatus(researcher, 6)).to.equal('authorized')
      expect(getAuthStatus(researcher, 7)).to.equal('authorized')
    })

    it('returns not_requested for unknown ids', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        authorizedDaaIds: [1],
      })
      expect(getAuthStatus(researcher, 99)).to.equal('not_requested')
    })
  })

  describe('buildDAARows', () => {
    it('deduplicates duplicate daaIds', () => {
      const researcher = makeResearcher({
        userId: 10,
        displayName: 'Test User',
        email: 'test@duos.org',
        authorizedDaaIds: [1],
      })
      const rows = buildDAARows(researcher, [
        makeDaa({ broadDaa: true, daaId: 1 }),
        makeDaa({ broadDaa: false, daaId: 1 }),
        makeDaa({ broadDaa: false, daaId: 2 }),
      ])
      expect(rows).to.have.length(2)
      expect(rows.map(row => row.daa.daaId)).to.deep.equal([1, 2])
    })
  })
})
