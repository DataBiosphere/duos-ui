import { getSearchFilterFunctions, formatDate, processElectionStatus, sortVisibleTable } from '../../../src/libs/utils'
import { toLower } from 'lodash/fp'
import { forEach } from 'lodash'

const sampleLCList = [
  {
    userName: 'Test Person',
    createDate: 1649163460401,
    updateDate: 1649163480401,
    userEmail: 'devemail',
  },
  {
    userName: 'another person',
    createDate: 1629163460401,
    updateDate: 1639163480801,
    userEmail: 'prodemail',
  },
]

const sampleResearcherList = [
  {
    displayName: 'Test Person',
    eraCommonsId: 'era',
    email: 'devemail',
    roles: [{
      name: 'admin',
    }],
  },
  {
    displayName: 'Another person',
    eraCommonsId: 'commons',
    email: 'prodemail',
    roles: [{
      name: 'researcher',
    }],
  },
]

const darCollectionSummaryOne = {
  darCode: 'DAR-1',
  datasetCount: 4005,
  name: 'summaryOne',
  institutionName: 'CompanyOne',
  researcherName: 'researcherOne',
  status: 'In Progress',
  submissionDate: 1649163460401,
}

const darCollectionSummaryTwo = {
  darCode: 'DAR-2',
  datasetCount: 3005,
  name: 'summaryTwo',
  institutionName: 'CompanyTwo',
  researcherName: 'researcherTwo',
  status: 'Complete',
  submissionDate: 1629163460401,
}

let collectionSearchFn, cardSearchFn, researcherSearchFn, summaryList

beforeEach(() => {
  const searchFunctionsMap = getSearchFilterFunctions()
  collectionSearchFn = searchFunctionsMap.darCollections
  cardSearchFn = searchFunctionsMap.libraryCard
  researcherSearchFn = searchFunctionsMap.signingOfficialResearchers
  summaryList = [darCollectionSummaryOne, darCollectionSummaryTwo]
})

describe('Dar Collection Search Filter', () => {
  it('filters on status', () => {
    const filteredList = collectionSearchFn('In Progress', summaryList)
    expect(filteredList.length).to.equal(1)
    expect(filteredList[0].darCode).to.equal(darCollectionSummaryOne.darCode)
    const closedFilteredList = collectionSearchFn('Complete', summaryList)
    expect(closedFilteredList.length).to.equal(1)
    expect(closedFilteredList[0].darCode).to.equal(darCollectionSummaryTwo.darCode)
  })

  it('filters on dataset count', () => {
    const filteredList = collectionSearchFn('4005', summaryList)
    expect(filteredList.length).to.equal(1)
    expect(filteredList[0].darCode).to.equal(darCollectionSummaryOne.darCode)
  })

  it('filters on collection name', () => {
    const filteredList = collectionSearchFn(darCollectionSummaryOne.name, summaryList)
    expect(filteredList.length).to.equal(1)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList.length).to.equal(0)
  })

  it('filters on institution', () => {
    const institutionTerm = darCollectionSummaryOne.institutionName
    const filteredList = collectionSearchFn(institutionTerm, summaryList)
    expect(filteredList.length).to.equal(1)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList.length).to.equal(0)
  })

  it('filters on dar code', () => {
    const darTerm = darCollectionSummaryOne.darCode
    const filteredList = collectionSearchFn(darTerm, summaryList)
    expect(filteredList.length).to.equal(1)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList.length).to.equal(0)
  })

  it('filters on submission date', () => {
    const formattedSubmissionDate = formatDate(darCollectionSummaryOne.submissionDate)
    const filteredList = collectionSearchFn(formattedSubmissionDate, summaryList)
    expect(filteredList.length).to.equal(1)
    expect(formatDate(filteredList[0].submissionDate)).to.equal(formattedSubmissionDate)
    const emptyList = collectionSearchFn('invalid', summaryList)
    expect(emptyList.length).to.equal(0)
  })

  it('filters on researcher name', () => {
    const researcherTerm = darCollectionSummaryOne.researcherName
    const filteredList = collectionSearchFn(researcherTerm, summaryList)
    expect(filteredList.length).to.equal(1)
    expect(filteredList[0].researcherName).to.equal(researcherTerm)
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

    const term = formatDate(originalCard.createDate)
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value)
    })
  })

  it('filters cards on update date', () => {
    let filteredList
    const originalCard = sampleLCList[0]
    filteredList = cardSearchFn('', sampleLCList)
    expect(filteredList.length).equals(sampleLCList.length)

    const term = formatDate(originalCard.updateDate)
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value)
    })
  })

  it('filters on user email', () => {
    let filteredList
    const originalCard = sampleLCList[0]
    filteredList = cardSearchFn('', sampleLCList)
    expect(filteredList.length).equals(sampleLCList.length)

    const term = 'test'
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value)
    })
  })

  it('filters on user email', () => {
    let filteredList
    const originalCard = sampleLCList[0]
    filteredList = cardSearchFn('', sampleLCList)
    expect(filteredList.length).equals(sampleLCList.length)

    const term = 'dev'
    filteredList = cardSearchFn(term, sampleLCList)
    expect(filteredList.length).equals(1)
    const filteredCard = filteredList[0]
    forEach(originalCard, (value, key) => {
      expect(filteredCard[key]).equals(value)
    })
  })
})

describe('Researcher Search Filter (SO Console)', () => {
  it('filters on researcher name', () => {
    let filteredList
    filteredList = researcherSearchFn('', sampleResearcherList)
    expect(filteredList.length).equals(sampleResearcherList.length)

    const originalResearcher = sampleResearcherList[0]
    const term = 'test'
    filteredList = researcherSearchFn(term, sampleResearcherList)
    expect(filteredList.length).equals(1)

    const filteredResearcher = filteredList[0]
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value)
    })
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
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value)
    })
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
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value)
    })
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
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value)
    })
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
    forEach(originalResearcher, (value, key) => {
      expect(filteredResearcher[key]).equals(value)
    })
  })
})

describe('processElectionStatus utils - tests', () => {
  it('Returns Unreviewed when election has a null status', () => {
    const election = { status: null }
    const status = processElectionStatus(election, null, false)
    expect(toLower(status)).equals('unreviewed')
  })

  it('Returns Approved when election is closed and has an approving final vote', () => {
    const election = {
      status: 'Closed',
    }
    const votes = [
      {
        type: 'FINAL',
        vote: true,
      },
    ]
    const status = processElectionStatus(election, votes, false)
    expect(toLower(status)).equals('approved')
  })

  it('Returns Approved when election is final and has an approving final vote', () => {
    const election = {
      status: 'Final',
    }
    const votes = [
      {
        type: 'FINAL',
        vote: true,
      },
    ]
    const status = processElectionStatus(election, votes, false)
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
        type: 'FINAL',
        vote: false,
      },
    ]
    const status = processElectionStatus(election, votes, false)
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
        type: 'FINAL',
        vote: false,
      },
    ]
    const status = processElectionStatus(election, votes, false)
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
    const status = processElectionStatus(election, votes, false)
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
    const status = processElectionStatus(election, votes, true)
    expect(toLower(status)).equals('open(1 / 2 votes)')
  })

  it('Vote counts for open election only considers DAC votes with electionId that matches the election', () => {
    const election = {
      status: 'Open',
      electionId: 1,
    }
    const votes = [
      {
        type: 'FINAL',
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
    const status = processElectionStatus(election, votes, true)
    expect(toLower(status)).equals('open(0 / 0 votes)')
  })

  it('sortVisibleTables returns the correct order', () => {
    const rowData = [
      [
        {
          data: 'Progress Report',
          cellStyle: {
            width: '10%',
          },
          label: 'Request Type',
          id: 0,
        },
        {
          data: 'DAR Title 1',
          cellStyle: {
            width: '20%',
          },
          label: 'DAR Title',
          id: 0,
        },
        {
          data: '2023-01-03',
          cellStyle: {
            width: '10%',
          },
          label: 'Election Date',
          id: 0,
        },
      ],
      [
        {
          data: 'Progress Report',
          cellStyle: {
            width: '10%',
          },
          label: 'Request Type',
          id: 2,
        },
        {
          data: 'DAR Title 3',
          cellStyle: {
            width: '20%',
          },
          label: 'DAR Title',
          id: 2,
        },
        {
          data: '2023-01-02',
          cellStyle: {
            width: '10%',
          },
          label: 'Election Date',
          id: 2,
        },
      ],
      [
        {
          data: 'Initial Dar',
          cellStyle: {
            width: '10%',
          },
          label: 'Request Type',
          id: 1,
        },
        {
          data: 'DAR Title 2',
          cellStyle: {
            width: '20%',
          },
          label: 'DAR Title',
          id: 1,
        },
        {
          data: '2023-01-01',
          cellStyle: {
            width: '10%',
          },
          label: 'Election Date',
          id: 1,
        },
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
  })
})
