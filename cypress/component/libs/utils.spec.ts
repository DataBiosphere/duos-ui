import { getSearchFilterFunctions, formatDate, processElectionStatus, sortVisibleTable, TableCell } from 'src/libs/utils'
import { toLower } from 'lodash/fp'
import { forEach } from 'lodash'
import { VOTE_TYPES } from 'src/utils/DarUtils'
import { Election, LibraryCard, Vote, DarCollection, Study } from 'src/types/model'
import { DuosUser } from 'src/types/model'

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

const darCollectionSummaryOne: DarCollection = {
  id: 1,
  darCode: 'DAR-1',
  createDate: 1649163460401,
  createUserId: 1,
  dars: {},
  datasets: [{
    name: 'Dataset 1',
    datasetId: 1,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 1,
    datasetIdentifier: 'TEST-001',
    dataUse: {},
  }, {
    name: 'Dataset 2',
    datasetId: 2,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 2,
    datasetIdentifier: 'TEST-002',
    dataUse: {},
  }, {
    name: 'Dataset 3',
    datasetId: 3,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 3,
    datasetIdentifier: 'TEST-003',
    dataUse: {},
  }, {
    name: 'Dataset 4',
    datasetId: 4,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 4,
    datasetIdentifier: 'TEST-004',
    dataUse: {},
  }],
} as DarCollection

const darCollectionSummaryTwo: DarCollection = {
  id: 2,
  darCode: 'DAR-2',
  createDate: 1629163460401,
  createUserId: 1,
  dars: {},
  datasets: [{
    name: 'Dataset 5',
    datasetId: 5,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 5,
    datasetIdentifier: 'TEST-005',
    dataUse: {},
  }, {
    name: 'Dataset 6',
    datasetId: 6,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 6,
    datasetIdentifier: 'TEST-006',
    dataUse: {},
  }, {
    name: 'Dataset 7',
    datasetId: 7,
    createUserId: 1,
    createUser: {} as DuosUser,
    createDate: new Date(),
    dacId: 1,
    translatedDataUse: 'test',
    deletable: true,
    properties: [],
    study: {} as Study,
    alias: 7,
    datasetIdentifier: 'TEST-007',
    dataUse: {},
  }],
} as DarCollection

let collectionSearchFn: (term: string, list: DarCollection[]) => DarCollection[]
let cardSearchFn: (term: string, list: LibraryCard[]) => LibraryCard[]
let researcherSearchFn: (term: string, list: DuosUser[]) => DuosUser[]
let summaryList: DarCollection[]

beforeEach(() => {
  const searchFunctionsMap = getSearchFilterFunctions()
  collectionSearchFn = searchFunctionsMap.darCollections as (term: string, list: DarCollection[]) => DarCollection[]
  cardSearchFn = searchFunctionsMap.libraryCard as (term: string, list: LibraryCard[]) => LibraryCard[]
  researcherSearchFn = searchFunctionsMap.signingOfficialResearchers
  summaryList = [darCollectionSummaryOne, darCollectionSummaryTwo]
})

describe('Dar Collection Search Filter', () => {
  it('filters on dar code', () => {
    const darTerm = darCollectionSummaryOne.darCode
    const filteredList = collectionSearchFn(darTerm, summaryList)
    expect(filteredList.length).to.equal(1)
    expect(filteredList[0].darCode).to.equal(darCollectionSummaryOne.darCode)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList.length).to.equal(0)
  })

  it('filters on dataset count', () => {
    const filteredList = collectionSearchFn('4', summaryList)
    expect(filteredList.length).to.equal(1)
    expect(filteredList[0].darCode).to.equal(darCollectionSummaryOne.darCode)
  })

  it('filters on submission date', () => {
    const formattedSubmissionDate = formatDate(darCollectionSummaryOne.createDate)
    const filteredList = collectionSearchFn(formattedSubmissionDate, summaryList)
    expect(filteredList.length).to.equal(1)
    expect(formatDate(filteredList[0].createDate)).to.equal(formattedSubmissionDate)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList.length).to.equal(0)
  })
})

describe('LC Search Filter', () => {
  it('filters cards on create date', () => {
    let filteredList
    const originalCard = sampleLCList[0]
    filteredList = cardSearchFn('', sampleLCList)
    expect(filteredList.length).equals(sampleLCList.length)

    const term = formatDate(originalCard.createDate.getTime())
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key as keyof LibraryCard]).equals(value)
    })
  })

  it('filters cards on user name', () => {
    let filteredList
    const originalCard = sampleLCList[0]
    filteredList = cardSearchFn('', sampleLCList)
    expect(filteredList.length).equals(sampleLCList.length)

    const term = 'test'
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key as keyof LibraryCard]).equals(value)
    })
  })

  it('filters on user email', () => {
    let filteredList
    const originalCard = sampleLCList[0]
    filteredList = cardSearchFn('', sampleLCList)
    expect(filteredList.length).equals(sampleLCList.length)

    const term = 'devemail'
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key as keyof LibraryCard]).equals(value)
    })
  })
})

describe('Researcher Search Filter (SO Console)', () => {
  function expectResearcherMatch(actual: DuosUser, expected: DuosUser) {
    expect(actual.displayName).to.equal(expected.displayName)
    expect(actual.email).to.equal(expected.email)
    expect(actual.eraCommonsId).to.equal(expected.eraCommonsId)
    expect(actual.roles[0].name).to.equal(expected.roles[0].name)
  }
  it('filters on researcher name', () => {
    let filteredList
    filteredList = researcherSearchFn('', sampleResearcherList)
    expect(filteredList.length).equals(sampleResearcherList.length)

    const originalResearcher = sampleResearcherList[0]
    const term = 'test'
    filteredList = researcherSearchFn(term, sampleResearcherList)
    expect(filteredList.length).equals(1)

    const filteredResearcher = filteredList[0]
    expectResearcherMatch(filteredResearcher, originalResearcher)
  })
  it('filters on eraCommonsId', () => {
    let filteredList
    filteredList = researcherSearchFn('', sampleResearcherList)
    expect(filteredList.length).equals(sampleResearcherList.length)

    const originalResearcher = sampleResearcherList[0]
    const term = 'era'
    filteredList = researcherSearchFn(term, sampleResearcherList)
    expect(filteredList.length).equals(1)

    const filteredResearcher = filteredList[0]
    expectResearcherMatch(filteredResearcher, originalResearcher)
  })
  it('filters on email', () => {
    let filteredList
    filteredList = researcherSearchFn('', sampleResearcherList)
    expect(filteredList.length).equals(sampleResearcherList.length)

    const originalResearcher = sampleResearcherList[0]
    const term = 'devemail'
    filteredList = researcherSearchFn(term, sampleResearcherList)
    expect(filteredList.length).equals(1)

    const filteredResearcher = filteredList[0]
    expectResearcherMatch(filteredResearcher, originalResearcher)
  })
  it('filters on role name', () => {
    let filteredList
    filteredList = researcherSearchFn('', sampleResearcherList)
    expect(filteredList.length).equals(sampleResearcherList.length)

    const originalResearcher = sampleResearcherList[0]
    const term = 'admin'
    filteredList = researcherSearchFn(term, sampleResearcherList)
    expect(filteredList.length).equals(1)

    const filteredResearcher = filteredList[0]
    expectResearcherMatch(filteredResearcher, originalResearcher)
  })
})

describe('processElectionStatus utils - tests', () => {
  it('Returns Unreviewed when election has a null status', () => {
    const election = {}
    const status = processElectionStatus(election as Election, null, false)
    expect(toLower(status)).equals('unreviewed')
  })

  it('Returns Approved when election is closed and has an approving final vote', () => {
    const election = {
      status: 'Closed',
    }
    const votes = [
      {
        type: VOTE_TYPES.FINAL,
        vote: true,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, false)
    expect(toLower(status)).equals('approved')
  })

  it('Returns Approved when election is final and has an approving final vote', () => {
    const election = {
      status: 'Final',
    }
    const votes = [
      {
        type: VOTE_TYPES.FINAL,
        vote: true,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, false)
    expect(toLower(status)).equals('approved')
  })

  it('Returns Denied when election is closed and there are no approving final votes', () => {
    const election = {
      status: 'Closed',
    }
    const votes = [
      {
        type: 'DAC',
        vote: true,
      },
      {
        type: VOTE_TYPES.FINAL,
        vote: false,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, false)
    expect(toLower(status)).equals('denied')
  })

  it('Returns Denied when election is final and there are no approving final votes', () => {
    const election = {
      status: 'Final',
    }
    const votes = [
      {
        type: 'DAC',
        vote: true,
      },
      {
        type: VOTE_TYPES.FINAL,
        vote: false,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, false)
    expect(toLower(status)).equals('denied')
  })

  it('Returns Open when election is open and contains votes', () => {
    const election = {
      status: 'Open',
      electionId: 1,
    }
    const votes = [
      {
        type: 'DAC',
        electionId: 1,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, false)
    expect(toLower(status)).equals('open')
  })

  it('Returns Open with vote counts when election is open, contains votes, and showVotes is true', () => {
    const election = {
      status: 'Open',
      electionId: 1,
    }
    const votes = [
      {
        type: 'DAC',
        electionId: 1,
      },
      {
        type: 'DAC',
        vote: false,
        createDate: 1651241829000,
        electionId: 1,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, true)
    expect(toLower(status)).equals('open(1 / 2 votes)')
  })

  it('Vote counts for open election only considers DAC votes with electionId that matches the election', () => {
    const election = {
      status: 'Open',
      electionId: 1,
    }
    const votes = [
      {
        type: VOTE_TYPES.FINAL,
        vote: true,
        createDate: 1651241829000,
        electionId: 1,
      },
      {
        type: 'DAC',
        vote: true,
        createDate: 1651241829000,
        electionId: 2,
      },
    ]
    const status = processElectionStatus(election as Election, votes as Array<Vote>, true)
    expect(toLower(status)).equals('open(0 / 0 votes)')
  })

  it('sortVisibleTables returns the correct order', () => {
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

    expect(rowData[0][1].data).to.equal('DAR Title 3')
    expect(rowData[1][1].data).to.equal('DAR Title 2')
    expect(rowData[2][1].data).to.equal('DAR Title 1')

    sortVisibleTable({ list: rowData, sort: { colIndex: 2, dir: 1 } })
    expect(rowData[0][2].data).to.equal('2023-01-01')
    expect(rowData[1][2].data).to.equal('2023-01-02')
    expect(rowData[2][2].data).to.equal('2023-01-03')

    sortVisibleTable({ list: rowData, sort: { colIndex: 3, dir: 1 } })
    expect(rowData[0][3].data).to.equal(true)
    expect(rowData[1][3].data).to.equal(false)
    expect(rowData[2][3].data).to.equal(false)

    sortVisibleTable({ list: rowData, sort: { colIndex: 3, dir: -1 } })
    expect(rowData[0][3].data).to.equal(false)
    expect(rowData[1][3].data).to.equal(false)
    expect(rowData[2][3].data).to.equal(true)
  })

  it('sortVisibleTables shouldn\'t error when no data is passed', () => {
    Cypress.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((message: string) => {
        throw new Error(`Console Error: ${message}`)
      })
    })
    sortVisibleTable({ list: undefined, sort: { colIndex: 1, dir: -1 } })
  })
})
