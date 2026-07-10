import { describe, it, expect, beforeEach } from 'vitest'
import { getSearchFilterFunctions, formatDate, processElectionStatus, sortVisibleTable, TableCell } from 'src/libs/utils'
import { toLower } from 'src/utils/NodashUtil'
import { VOTE_TYPES } from 'src/utils/DarUtils'
import { DuosUser, Election, LibraryCard, Vote, DarCollectionSummary } from 'src/types/model'

const sampleLCList: LibraryCard[] = [
  {
    id: 1,
    userId: 1,
    userName: 'Test Person',
    createDate: new Date(1649163460401),
    createUserId: 1,
    userEmail: 'devemail',
  },
  {
    id: 2,
    userId: 2,
    userName: 'another person',
    createDate: new Date(1629163460401),
    createUserId: 2,
    userEmail: 'prodemail',
  },
]

const sampleResearcherList: DuosUser[] = [
  {
    createDate: new Date(),
    displayName: 'Test Person',
    email: 'devemail',
    emailPreference: true,
    eraCommonsId: 'era',
    institutionId: 1,
    institution: undefined,
    isAdmin: true,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: true,
    isSigningOfficial: false,
    libraryCard: undefined,
    properties: [],
    roles: [{ roleId: 1, name: 'Admin', userId: 1, userRoleId: 1 }],
    userId: 1,
    userStatusInfo: undefined,
  },
  {
    createDate: new Date(),
    displayName: 'Another person',
    email: 'prodemail',
    emailPreference: true,
    eraCommonsId: 'commons',
    institutionId: 2,
    institution: undefined,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: true,
    isSigningOfficial: false,
    libraryCard: undefined,
    properties: [],
    roles: [{ roleId: 2, name: 'Researcher', userId: 2, userRoleId: 2 }],
    userId: 2,
    userStatusInfo: undefined,
  },
]

const darCollectionSummaryOne: DarCollectionSummary = {
  darCode: 'DAR-1',
  darCollectionId: 1,
  name: 'Test Collection 1',
  researcherName: 'Researcher One',
  institutionName: 'Institution One',
  status: 'Submitted',
  dacNames: ['Test DAC'],
  dacCode: 'DAC-1',
  datasetCount: 4,
  datasetIds: [1, 2, 3, 4],
  submissionDate: 1649163460401,
  actions: [],
  expired: false,
  expiresAt: 0,
  latestReferenceId: 'DAR-1',
  progressReport: false,
  referenceIds: [],
  requiresSOApproval: false,
}

const darCollectionSummaryTwo: DarCollectionSummary = {
  darCode: 'DAR-2',
  darCollectionId: 2,
  name: 'Test Collection 2',
  researcherName: 'Researcher Two',
  institutionName: 'Institution Two',
  status: 'Submitted',
  dacNames: ['Test DAC'],
  dacCode: 'DAC-2',
  datasetCount: 3,
  datasetIds: [5, 6, 7],
  submissionDate: 1629163460401,
  actions: [],
  expired: false,
  expiresAt: 0,
  latestReferenceId: 'DAR-2',
  progressReport: false,
  referenceIds: [],
  requiresSOApproval: false,
}

let collectionSearchFn: (term: string, list: DarCollectionSummary[]) => DarCollectionSummary[]
let cardSearchFn: (term: string, list: LibraryCard[]) => LibraryCard[]
let researcherSearchFn: (term: string, list: DuosUser[]) => DuosUser[]
let summaryList: DarCollectionSummary[]

const expectResearcherMatch = (actual: DuosUser, expected: DuosUser) => {
  expect(actual.displayName).toBe(expected.displayName)
  expect(actual.email).toBe(expected.email)
  expect(actual.eraCommonsId).toBe(expected.eraCommonsId)
  expect(actual.roles[0].name).toBe(expected.roles[0].name)
}

beforeEach(() => {
  const searchFunctionsMap = getSearchFilterFunctions()
  collectionSearchFn = searchFunctionsMap.darCollections
  cardSearchFn = searchFunctionsMap.libraryCard as (term: string, list: LibraryCard[]) => LibraryCard[]
  researcherSearchFn = searchFunctionsMap.signingOfficialResearchers
  summaryList = [darCollectionSummaryOne, darCollectionSummaryTwo]
})

function testFilter<T>(
  filterFn: (term: string, list: T[]) => T[],
  list: T[],
  term: string,
  expected: T,
  matchFn: (actual: T, expected: T) => void,
) {
  const filteredList = filterFn(term, list)
  expect(filteredList).toHaveLength(1)
  matchFn(filteredList[0], expected)
}

const expectLibraryCardMatch = (actual: LibraryCard, expected: LibraryCard) => {
  Object.keys(expected).forEach((key) => {
    expect(actual[key as keyof LibraryCard]).toBe(expected[key as keyof LibraryCard])
  })
}

describe('Dar Collection Search Filter', () => {
  it('filters on dar code', () => {
    const darTerm = darCollectionSummaryOne.darCode
    const filteredList = collectionSearchFn(darTerm, summaryList)
    expect(filteredList).toHaveLength(1)
    expect(filteredList[0].darCode).toBe(darCollectionSummaryOne.darCode)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList).toHaveLength(0)
  })

  it('filters on dataset count', () => {
    const filteredList = collectionSearchFn('4', summaryList)
    expect(filteredList).toHaveLength(1)
    expect(filteredList[0].darCode).toBe(darCollectionSummaryOne.darCode)
  })

  it('filters on submission date', () => {
    const formattedSubmissionDate = formatDate(darCollectionSummaryOne.submissionDate)
    const filteredList = collectionSearchFn(formattedSubmissionDate, summaryList)
    expect(filteredList).toHaveLength(1)
    expect(formatDate(filteredList[0].submissionDate)).toBe(formattedSubmissionDate)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList).toHaveLength(0)
  })
})

describe('LC Search Filter', () => {
  it('filters cards on create date', () => {
    const originalCard = sampleLCList[0]
    testFilter(cardSearchFn, sampleLCList, formatDate(originalCard.createDate.getTime()), originalCard, expectLibraryCardMatch)
  })

  it('filters cards on user name', () => {
    const originalCard = sampleLCList[0]
    testFilter(cardSearchFn, sampleLCList, 'test', originalCard, expectLibraryCardMatch)
  })

  it('filters on user email', () => {
    const originalCard = sampleLCList[0]
    testFilter(cardSearchFn, sampleLCList, 'devemail', originalCard, expectLibraryCardMatch)
  })
})

describe('Researcher Search Filter (SO Console)', () => {
  it.each([
    ['name', 'test'],
    ['eraCommonsId', 'era'],
    ['email', 'devemail'],
    ['role name', 'admin'],
  ])('filters on researcher %s', (_field, term) => {
    testFilter(researcherSearchFn, sampleResearcherList, term, sampleResearcherList[0], expectResearcherMatch)
  })
})

describe('processElectionStatus utils - tests', () => {
  it('Returns Unreviewed when election has a null status', () => {
    const election = {} as Election
    const status = processElectionStatus(election, null, false)
    expect(toLower(status)).toBe('unreviewed')
  })

  it('Returns Approved when election is closed and has an approving final vote', () => {
    const election = { status: 'Closed' } as Election
    const votes = [{ type: VOTE_TYPES.FINAL, vote: true }] as Vote[]
    const status = processElectionStatus(election, votes, false)
    expect(toLower(status)).toBe('approved')
  })

  it('Returns Approved when election is final and has an approving final vote', () => {
    const election = { status: 'Final' } as Election
    const votes = [{ type: VOTE_TYPES.FINAL, vote: true }] as Vote[]
    const status = processElectionStatus(election, votes, false)
    expect(toLower(status)).toBe('approved')
  })

  it('Returns Denied when election is closed and there are no approving final votes', () => {
    const election = { status: 'Closed' } as Election
    const votes = [
      { type: 'DAC', vote: true },
      { type: VOTE_TYPES.FINAL, vote: false },
    ] as Vote[]
    const status = processElectionStatus(election, votes, false)
    expect(toLower(status)).toBe('denied')
  })

  it('Returns Denied when election is final and there are no approving final votes', () => {
    const election = { status: 'Final' } as Election
    const votes = [
      { type: 'DAC', vote: true },
      { type: VOTE_TYPES.FINAL, vote: false },
    ] as Vote[]
    const status = processElectionStatus(election, votes, false)
    expect(toLower(status)).toBe('denied')
  })

  it('Returns Open when election is open and contains votes', () => {
    const election = { status: 'Open', electionId: 1 } as Election
    const votes = [{ type: 'DAC', electionId: 1 }] as Vote[]
    const status = processElectionStatus(election, votes, false)
    expect(toLower(status)).toBe('open')
  })

  it('Returns Open with vote counts when election is open, contains votes, and showVotes is true', () => {
    const election = { status: 'Open', electionId: 1 } as Election
    const votes = [
      { type: 'DAC', electionId: 1 },
      { type: 'DAC', vote: false, createDate: 1651241829000, electionId: 1 },
    ] as Vote[]
    const status = processElectionStatus(election, votes, true)
    expect(toLower(status)).toBe('open(1 / 2 votes)')
  })

  it('Vote counts for open election only considers DAC votes with electionId that matches the election', () => {
    const election = { status: 'Open', electionId: 1 } as Election
    const votes = [
      { type: VOTE_TYPES.FINAL, vote: true, createDate: 1651241829000, electionId: 1 },
      { type: 'DAC', vote: true, createDate: 1651241829000, electionId: 2 },
    ] as Vote[]
    const status = processElectionStatus(election, votes, true)
    expect(toLower(status)).toBe('open(0 / 0 votes)')
  })

  it('sortVisibleTable returns the correct order', () => {
    const rowData: TableCell[][] = [
      [
        { data: 'Progress Report', cellStyle: { width: '10%' }, label: 'Request Type', id: 0 },
        { data: 'DAR Title 1', cellStyle: { width: '20%' }, label: 'DAR Title', id: 0 },
        { data: '2023-01-03', cellStyle: { width: '10%' }, label: 'Election Date', id: 0 },
        { data: false, cellStyle: { width: '20%' }, label: 'Boolean Value', id: 0 },
      ],
      [
        { data: 'Progress Report', cellStyle: { width: '10%' }, label: 'Request Type', id: 2 },
        { data: 'DAR Title 3', cellStyle: { width: '20%' }, label: 'DAR Title', id: 2 },
        { data: '2023-01-02', cellStyle: { width: '10%' }, label: 'Election Date', id: 2 },
        { data: true, cellStyle: { width: '20%' }, label: 'Boolean Value', id: 0 },
      ],
      [
        { data: 'Initial Dar', cellStyle: { width: '10%' }, label: 'Request Type', id: 1 },
        { data: 'DAR Title 2', cellStyle: { width: '20%' }, label: 'DAR Title', id: 1 },
        { data: '2023-01-01', cellStyle: { width: '10%' }, label: 'Election Date', id: 1 },
        { data: false, cellStyle: { width: '20%' }, label: 'Boolean Value', id: 0 },
      ],
    ]

    sortVisibleTable({ list: rowData, sort: { colIndex: 1, dir: -1 } })
    expect(rowData[0][1].data).toBe('DAR Title 3')
    expect(rowData[1][1].data).toBe('DAR Title 2')
    expect(rowData[2][1].data).toBe('DAR Title 1')

    sortVisibleTable({ list: rowData, sort: { colIndex: 2, dir: 1 } })
    expect(rowData[0][2].data).toBe('2023-01-01')
    expect(rowData[1][2].data).toBe('2023-01-02')
    expect(rowData[2][2].data).toBe('2023-01-03')

    sortVisibleTable({ list: rowData, sort: { colIndex: 3, dir: 1 } })
    expect(rowData[0][3].data).toBe(true)
    expect(rowData[1][3].data).toBe(false)
    expect(rowData[2][3].data).toBe(false)

    sortVisibleTable({ list: rowData, sort: { colIndex: 3, dir: -1 } })
    expect(rowData[0][3].data).toBe(false)
    expect(rowData[1][3].data).toBe(false)
    expect(rowData[2][3].data).toBe(true)
  })

  it('sortVisibleTable should not error when no data is passed', () => {
    expect(() => sortVisibleTable({ list: undefined, sort: { colIndex: 1, dir: -1 } })).not.toThrow()
  })
})
