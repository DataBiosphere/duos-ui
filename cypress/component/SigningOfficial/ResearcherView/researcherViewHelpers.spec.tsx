import {
  buildDAARows,
  getAuthStatus,
} from 'src/pages/signing_official_console/ResearcherView/researcherViewHelpers'
import { DAAObject, DuosUser } from 'src/types/model'

const makeResearcher = (daaIds: unknown[]): DuosUser => ({
  userId: 10,
  displayName: 'Test User',
  email: 'test@duos.org',
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
    userId: 10,
    userName: 'Test User',
    userEmail: 'test@duos.org',
    createDate: new Date('2023-01-01'),
    createUserId: 1,
    daaIds: daaIds as number[],
  },
})

const makeDaa = (broadDaa: boolean, daaId: number): DAAObject => ({
  broadDaa,
  daaId,
  createUserId: 1,
  createDate: '2024-01-15',
  updateUserId: 1,
  updateDate: '2024-01-15',
  initialDacId: 10,
  file: {
    fileStorageObjectId: daaId,
    entityId: `entity-${daaId}`,
    fileName: `DAA-${daaId}.pdf`,
    category: 'dataAccessAgreement',
    mediaType: 'application/pdf',
    createUserId: 1,
    createDate: 1705276800,
  },
  dacs: [{ dacId: 10, name: 'DAC-10' }],
})

describe('researcherViewHelpers', () => {
  describe('getAuthStatus', () => {
    it('treats numeric and string ids as authorized', () => {
      const researcher = makeResearcher([1, '2'] as unknown[])
      expect(getAuthStatus(researcher, 1)).to.equal('authorized')
      expect(getAuthStatus(researcher, 2)).to.equal('authorized')
    })

    it('supports comma separated id strings and object ids', () => {
      const researcher = makeResearcher(['3,4', { daaId: 5 }, { id: 6 }, { value: 7 }] as unknown[])
      expect(getAuthStatus(researcher, 3)).to.equal('authorized')
      expect(getAuthStatus(researcher, 4)).to.equal('authorized')
      expect(getAuthStatus(researcher, 5)).to.equal('authorized')
      expect(getAuthStatus(researcher, 6)).to.equal('authorized')
      expect(getAuthStatus(researcher, 7)).to.equal('authorized')
    })

    it('returns not_requested for unknown ids', () => {
      const researcher = makeResearcher([1])
      expect(getAuthStatus(researcher, 99)).to.equal('not_requested')
    })
  })

  describe('buildDAARows', () => {
    it('deduplicates duplicate daaIds', () => {
      const researcher = makeResearcher([1])
      const rows = buildDAARows(researcher, [makeDaa(true, 1), makeDaa(false, 1), makeDaa(false, 2)])
      expect(rows).to.have.length(2)
      expect(rows.map(row => row.daa.daaId)).to.deep.equal([1, 2])
    })
  })
})
