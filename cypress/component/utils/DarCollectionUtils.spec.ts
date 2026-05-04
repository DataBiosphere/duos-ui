import {
  updateCollectionFn,
  cancelCollectionFn,
  openCollectionFn,
  approveCollectionFn,
  extractDacDataAccessVotesFromBucket,
  extractDacRPVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
  extractUserRPVotesFromBucket,
  collapseVotesByUser,
  updateFinalVote,
  rpVoteKey,
  processVotesForBucket,
  consoleTypes,
  DarCollectionTableColumnOptions,
  VoteBucket,
} from 'src/utils/DarCollectionUtils'
import { Collections } from 'src/libs/ajax/Collections'
import { formatDate, Notifications } from 'src/libs/utils'
import { DarCollectionSummary, Vote } from 'src/types/model'

// Helper to cast partial bucket objects for tests
const asBucket = (partial: object): VoteBucket => partial as unknown as VoteBucket
const asCollections = (partial: object[]): DarCollectionSummary[] => partial as unknown as DarCollectionSummary[]
const asCollection = (partial: object): DarCollectionSummary => partial as unknown as DarCollectionSummary

const expectIncludedVotes = (votes: unknown[], expected: unknown[]) => {
  expected.forEach((vote) => {
    expect(votes).to.deep.include(vote)
  })
}

const expectExcludedVotes = (votes: unknown[], unexpected: unknown[]) => {
  unexpected.forEach((vote) => {
    expect(votes).to.not.deep.include(vote)
  })
}

type DacVoteScope = 'dataAccess' | 'rp'
type DacVoteExtractor = (bucket: VoteBucket | null | undefined, user: { userId: number }, adminPage?: boolean) => unknown[]
type VotePayloadExpectation = {
  vote: boolean
  rationale: string
}

const getBucketVotesForScope = (bucket: VoteBucket, scope: DacVoteScope): Vote[] =>
  (bucket.votes ?? []).flatMap((voteGroup) => {
    const scopedVotes = voteGroup[scope]
    return [...(scopedVotes?.finalVotes ?? []), ...(scopedVotes?.chairpersonVotes ?? [])]
  })

const expectVotePayloadApplied = ({
  votes,
  voteIds,
  votePayload,
}: {
  votes: Vote[]
  voteIds: number[]
  votePayload: VotePayloadExpectation
}) => {
  votes.forEach((vote) => {
    if (voteIds.includes(vote.voteId)) {
      expect(vote.vote).to.equal(votePayload.vote)
      expect(vote.rationale).to.equal(votePayload.rationale)
    }
    else {
      expect(vote.vote).to.equal(undefined)
      expect(vote.rationale).to.equal(undefined)
    }
  })
}

const runDacExtractionSuite = ({
  suiteName,
  scope,
  extractor,
}: {
  suiteName: string
  scope: DacVoteScope
  extractor: DacVoteExtractor
}) => {
  const otherScope: DacVoteScope = scope === 'dataAccess' ? 'rp' : 'dataAccess'

  describe(suiteName, () => {
    it('returns empty list if scoped votes in this bucket do not have the userId of the given user', () => {
      const bucket = asBucket({
        votes: [{ [scope]: { memberVotes: [{ userId: 2 }, { userId: 3 }] } }],
      })

      const votes = extractor(bucket, { userId: 1 })
      expect(votes).to.have.lengthOf(0)
    })

    it('returns all member votes in the same scoped elections as the given user', () => {
      const bucket = asBucket({
        votes: [
          { [scope]: { memberVotes: [{ userId: 1 }, { vote: false, userId: 2 }, { userId: 3 }] } },
          { [scope]: { memberVotes: [{ vote: true, userId: 4 }, { vote: false, rationale: 'rationale', userId: 1 }] } },
          { [scope]: { memberVotes: [{ vote: true, userId: 5 }, { userId: 6 }] } },
        ],
      })

      const votes = extractor(bucket, { userId: 1 })
      expect(votes).to.have.lengthOf(5)
      expectIncludedVotes(votes, [
        { userId: 1 },
        { vote: false, userId: 2 },
        { userId: 3 },
        { vote: true, userId: 4 },
        { vote: false, rationale: 'rationale', userId: 1 },
      ])
      expectExcludedVotes(votes, [
        { vote: true, userId: 5 },
        { userId: 6 },
      ])
    })

    it(`only returns ${scope} votes`, () => {
      const bucket = asBucket({
        votes: [{
          [scope]: { memberVotes: [{ vote: true, userId: 1 }, { userId: 2 }] },
          [otherScope]: { memberVotes: [{ userId: 1 }, { vote: false, userId: 3 }] },
        }],
      })

      const votes = extractor(bucket, { userId: 1 })
      expect(votes).to.have.lengthOf(2)
      expectIncludedVotes(votes, [{ vote: true, userId: 1 }, { userId: 2 }])
      expectExcludedVotes(votes, [{ userId: 1 }, { vote: false, userId: 3 }])
    })

    it('only returns member votes', () => {
      const bucket = asBucket({
        votes: [{
          [scope]: {
            memberVotes: [{ userId: 1 }, { vote: false, userId: 3 }],
            chairpersonVotes: [{ vote: true, userId: 1 }, { userId: 2 }],
          },
        }],
      })

      const votes = extractor(bucket, { userId: 1 })
      expect(votes).to.have.lengthOf(2)
      expectIncludedVotes(votes, [{ userId: 1 }, { vote: false, userId: 3 }])
      expectExcludedVotes(votes, [{ vote: true, userId: 1 }, { userId: 2 }])
    })

    it('returns all scoped member votes regardless of user when adminPage is true', () => {
      const bucket = asBucket({
        votes: [
          { [scope]: { memberVotes: [{ userId: 2 }, { userId: 3 }] } },
          { [scope]: { memberVotes: [{ userId: 4 }] } },
        ],
      })

      const votes = extractor(bucket, { userId: 1 }, true)
      expect(votes).to.have.lengthOf(3)
      expectIncludedVotes(votes, [{ userId: 2 }, { userId: 3 }, { userId: 4 }])
    })

    it('returns empty array for null bucket', () => {
      const votes = extractor(null, { userId: 1 })
      expect(votes).to.have.lengthOf(0)
    })
  })
}

runDacExtractionSuite({
  suiteName: 'extractDacDataAccessVotesFromBucket',
  scope: 'dataAccess',
  extractor: extractDacDataAccessVotesFromBucket,
})

runDacExtractionSuite({
  suiteName: 'extractDacRPVotesFromBucket',
  scope: 'rp',
  extractor: extractDacRPVotesFromBucket,
})

type UserVoteExtractor = (
  bucket: VoteBucket | null | undefined,
  user: { userId: number },
  isChair?: boolean,
  adminPage?: boolean,
) => unknown[]

const runUserExtractionSuite = ({
  suiteName,
  scope,
  extractor,
}: {
  suiteName: string
  scope: DacVoteScope
  extractor: UserVoteExtractor
}) => {
  describe(suiteName, () => {
    const otherScope: DacVoteScope = scope === 'dataAccess' ? 'rp' : 'dataAccess'

    it('returns scoped votes by this user', () => {
      const bucket = asBucket({
        votes: [
          {
            [scope]: { memberVotes: [{ userId: 1 }, { userId: 2 }] },
            [otherScope]: { memberVotes: [{ vote: false, userId: 1 }] },
          },
          {
            [scope]: { memberVotes: [{ vote: true, userId: 1 }, { userId: 3 }] },
          },
        ],
      })

      const votes = extractor(bucket, { userId: 1 }, false)
      expect(votes).to.have.lengthOf(2)
      expectIncludedVotes(votes, [{ userId: 1 }, { vote: true, userId: 1 }])
      expectExcludedVotes(votes, [{ userId: 2 }, { userId: 3 }])
    })

    it('only returns member votes if isChair is false', () => {
      const bucket = asBucket({
        votes: [{
          [scope]: {
            memberVotes: [{ userId: 1 }, { vote: false, userId: 2 }],
            chairpersonVotes: [{ vote: true, userId: 1 }, { userId: 3 }],
            finalVotes: [{ vote: true, userId: 1 }],
          },
        }],
      })

      const votes = extractor(bucket, { userId: 1 }, false)
      expect(votes).to.have.lengthOf(1)
      expectIncludedVotes(votes, [{ userId: 1 }])
      expectExcludedVotes(votes, [{ vote: true, userId: 1 }, { vote: false, userId: 2 }, { userId: 3 }])
    })

    it('returns chairperson-scoped votes if isChair is true', () => {
      const bucket = asBucket({
        votes: [{
          [scope]: {
            memberVotes: [{ userId: 1 }, { vote: false, userId: 2 }],
            chairpersonVotes: [{ vote: true, userId: 1 }, { userId: 3 }],
            finalVotes: [{ vote: true, userId: 1 }],
          },
        }],
      })

      const votes = extractor(bucket, { userId: 1 }, true)
      expect(votes.length).to.be.greaterThan(0)
      expectExcludedVotes(votes, [{ vote: false, userId: 2 }, { userId: 3 }])
    })

    it('returns empty array for null bucket', () => {
      const votes = extractor(null, { userId: 1 })
      expect(votes).to.have.lengthOf(0)
    })
  })
}

runUserExtractionSuite({
  suiteName: 'extractUserDataAccessVotesFromBucket',
  scope: 'dataAccess',
  extractor: extractUserDataAccessVotesFromBucket,
})

describe('extractUserDataAccessVotesFromBucket edge cases', () => {
  it('returns radar votes for chairperson flow', () => {
    const bucket = asBucket({
      votes: [{
        dataAccess: {
          memberVotes: [{ userId: 1 }, { vote: false, userId: 3 }],
          chairpersonVotes: [{ vote: false, userId: 1 }, { userId: 2 }],
          radarVotes: [{ vote: true, userId: 1 }],
        },
      }],
    })

    const votes = extractUserDataAccessVotesFromBucket(bucket, { userId: 1 }, true)
    expect(votes).to.have.lengthOf(2)
    expectIncludedVotes(votes, [{ vote: true, userId: 1 }, { vote: false, userId: 1 }])
    expectExcludedVotes(votes, [{ userId: 2 }])
  })

  it('returns all chair/final/radar votes regardless of user on adminPage', () => {
    const bucket = asBucket({
      votes: [{
        dataAccess: {
          chairpersonVotes: [{ vote: true, userId: 10 }, { vote: false, userId: 20 }],
          memberVotes: [{ userId: 30 }],
          finalVotes: [{ vote: true, userId: 40 }],
          radarVotes: [{ vote: true, userId: 50 }],
        },
      }],
    })

    const votes = extractUserDataAccessVotesFromBucket(bucket, { userId: 1 }, false, true)
    expect(votes).to.have.lengthOf(4)
    expectIncludedVotes(votes, [
      { vote: true, userId: 10 },
      { vote: false, userId: 20 },
      { vote: true, userId: 40 },
      { vote: true, userId: 50 },
    ])
  })
})

runUserExtractionSuite({
  suiteName: 'extractUserRPVotesFromBucket',
  scope: 'rp',
  extractor: extractUserRPVotesFromBucket,
})

describe('extractUserRPVotesFromBucket edge cases', () => {
  it('adminPage only returns chairperson votes with explicit vote values', () => {
    const bucket = asBucket({
      votes: [{
        rp: {
          memberVotes: [{ vote: true, userId: 1 }],
          chairpersonVotes: [
            { vote: true, userId: 2 },
            { vote: false, userId: 3 },
            { userId: 4 },
          ],
        },
      }],
    })

    const votes = extractUserRPVotesFromBucket(bucket, { userId: 1 }, false, true)
    expect(votes).to.have.lengthOf(2)
    expectIncludedVotes(votes, [{ vote: true, userId: 2 }, { vote: false, userId: 3 }])
    expectExcludedVotes(votes, [{ userId: 4 }])
  })
})

describe('processVotesForBucket', () => {
  it('preserves output bucketing and source vote mutation for mixed RP/DataAccess elections', () => {
    const elections = [
      {
        electionId: 11,
        electionType: 'RP',
        status: 'Open',
        votes: {
          1: { voteId: 1, userId: 1, type: 'Chairperson', electionId: 11, displayName: 'RP Chair', createDate: '100' },
          2: { voteId: 2, userId: 2, type: 'DAC', electionId: 11, displayName: 'RP Member', createDate: '101' },
        },
      },
      {
        electionId: 12,
        electionType: 'DataAccess',
        status: 'Closed',
        votes: {
          3: { voteId: 3, userId: 3, type: 'Chairperson', electionId: 12, displayName: 'DA Chair', createDate: '102' },
          4: { voteId: 4, userId: 4, type: 'DAC', electionId: 12, displayName: 'DA Member', createDate: '103' },
          5: { voteId: 5, userId: 5, type: 'Final', electionId: 12, displayName: 'DA Final', createDate: '104' },
        },
      },
    ]

    const result = processVotesForBucket(elections as never)

    expect(result.rp.chairpersonVotes).to.have.lengthOf(1)
    expect(result.rp.memberVotes).to.have.lengthOf(1)
    expect(result.rp.finalVotes).to.have.lengthOf(1)
    expect(result.dataAccess.chairpersonVotes).to.have.lengthOf(1)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(1)
    expect(result.dataAccess.finalVotes).to.have.lengthOf(1)

    expect((elections[0].votes[1] as { electionStatus?: string }).electionStatus).to.equal('Open')
    expect((elections[0].votes[2] as { electionStatus?: string }).electionStatus).to.equal('Open')
    expect((elections[1].votes[3] as { electionStatus?: string }).electionStatus).to.equal('Closed')
    expect((elections[1].votes[4] as { electionStatus?: string }).electionStatus).to.equal('Closed')
    expect((elections[1].votes[5] as { electionStatus?: string }).electionStatus).to.equal('Closed')
  })

  it('returns empty vote arrays for no elections', () => {
    const result = processVotesForBucket([])
    expect(result.rp.chairpersonVotes).to.have.lengthOf(0)
    expect(result.rp.memberVotes).to.have.lengthOf(0)
    expect(result.rp.finalVotes).to.have.lengthOf(0)
    expect(result.dataAccess.chairpersonVotes).to.have.lengthOf(0)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(0)
    expect(result.dataAccess.finalVotes).to.have.lengthOf(0)
    expect(result.dataAccess.radarVotes).to.have.lengthOf(0)
  })

  it('categorizes RP election votes correctly', () => {
    const elections = [{
      electionId: 1,
      electionType: 'RP',
      status: 'Open',
      votes: {
        1: { voteId: 1, userId: 1, type: 'Chairperson', electionId: 1, displayName: 'Chair', createDate: '100' },
        2: { voteId: 2, userId: 2, type: 'DAC', electionId: 1, displayName: 'Member', createDate: '100' },
      },
    }]
    const result = processVotesForBucket(elections as never)
    expect(result.rp.chairpersonVotes).to.have.lengthOf(1)
    expect(result.rp.memberVotes).to.have.lengthOf(1)
    // RP chairperson votes also go to finalVotes
    expect(result.rp.finalVotes).to.have.lengthOf(1)
    // Data access should remain empty
    expect(result.dataAccess.chairpersonVotes).to.have.lengthOf(0)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(0)
  })

  it('categorizes data access election votes correctly', () => {
    const elections = [{
      electionId: 2,
      electionType: 'DataAccess',
      status: 'Open',
      votes: {
        1: { voteId: 1, userId: 1, type: 'Chairperson', electionId: 2, displayName: 'Chair', createDate: '100' },
        2: { voteId: 2, userId: 2, type: 'DAC', electionId: 2, displayName: 'Member', createDate: '100' },
        3: { voteId: 3, userId: 3, type: 'Final', electionId: 2, displayName: 'Final', createDate: '100' },
      },
    }]
    const result = processVotesForBucket(elections as never)
    expect(result.dataAccess.chairpersonVotes).to.have.lengthOf(1)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(1)
    expect(result.dataAccess.finalVotes).to.have.lengthOf(1)
    expect(result.rp.chairpersonVotes).to.have.lengthOf(0)
    expect(result.rp.memberVotes).to.have.lengthOf(0)
  })

  it('routes radar_approve votes to radarVotes', () => {
    const elections = [{
      electionId: 3,
      electionType: 'DataAccess',
      status: 'Open',
      votes: {
        1: { voteId: 1, userId: 1, type: 'RADAR_APPROVE', electionId: 3, displayName: 'Radar', createDate: '100' },
      },
    }]
    const result = processVotesForBucket(elections as never)
    expect(result.dataAccess.radarVotes).to.have.lengthOf(1)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(0)
    expect(result.dataAccess.chairpersonVotes).to.have.lengthOf(0)
  })

  it('annotates votes with electionStatus from election', () => {
    const elections = [{
      electionId: 4,
      electionType: 'DataAccess',
      status: 'Closed',
      votes: {
        1: { voteId: 1, userId: 1, type: 'DAC', electionId: 4, displayName: 'Member', createDate: '100' },
      },
    }]
    const result = processVotesForBucket(elections as never)
    const vote = result.dataAccess.memberVotes[0]
    expect((vote as never as { electionStatus: string }).electionStatus).to.equal('Closed')
  })

  it('handles multiple elections of different types', () => {
    const elections = [
      {
        electionId: 1,
        electionType: 'RP',
        status: 'Open',
        votes: {
          1: { voteId: 1, userId: 1, type: 'DAC', electionId: 1, displayName: 'Member', createDate: '100' },
        },
      },
      {
        electionId: 2,
        electionType: 'DataAccess',
        status: 'Open',
        votes: {
          2: { voteId: 2, userId: 2, type: 'DAC', electionId: 2, displayName: 'Member', createDate: '100' },
        },
      },
    ]
    const result = processVotesForBucket(elections as never)
    expect(result.rp.memberVotes).to.have.lengthOf(1)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(1)
  })

  it('uses empty array as default for omitted elections argument', () => {
    const result = processVotesForBucket()
    expect(result.rp.memberVotes).to.have.lengthOf(0)
    expect(result.dataAccess.memberVotes).to.have.lengthOf(0)
  })
})

describe('updateCollectionFn', () => {
  it('generates an update callback function for consoles to use', () => {
    const collections = asCollections([{}])
    const filterFn = () => collections
    const searchText = undefined
    const setCollections = (_arr: DarCollectionSummary[]) => {}
    const setFilteredList = (_arr: DarCollectionSummary[]) => {}

    cy.wrap(updateCollectionFn({ collections, filterFn, searchText, setCollections, setFilteredList })).should('exist')
  })

  it('updates collections and filteredList with the filter results', () => {
    let filteredList: DarCollectionSummary[] = []
    let collections = asCollections([{ darCollectionId: 1, dars: {} }])
    const updatedList = asCollections([{ darCollectionId: 1, dars: {} }])
    const updatedCollection = asCollection({ darCollectionId: 1, dars: { 1: { data: 'test' } } })
    const setFilteredList = (arr: DarCollectionSummary[]) => {
      filteredList = arr
    }
    const setCollections = (arr: DarCollectionSummary[]) => {
      collections = arr
    }
    const filterFn = () => updatedList
    const searchText = undefined
    const callback = updateCollectionFn({ collections, filterFn, searchText, setCollections, setFilteredList })

    callback(updatedCollection)
    expect(filteredList[0].darCollectionId).to.equal(updatedList[0].darCollectionId)
    expect(collections[0].darCollectionId).to.equal(updatedCollection.darCollectionId)
  })

  it('shows an error notification when the collection is not found', () => {
    const collections = asCollections([{ darCollectionId: 99, darCode: 'DAR-99' }])
    const filterFn = () => collections
    const setCollections = (_arr: DarCollectionSummary[]) => {}
    const setFilteredList = (_arr: DarCollectionSummary[]) => {}

    cy.stub(Notifications, 'showError').returns(undefined)

    const callback = updateCollectionFn({ collections, filterFn, setCollections, setFilteredList })
    callback(asCollection({ darCollectionId: 999, darCode: 'DAR-MISSING' }))

    cy.wrap(Notifications.showError).should('have.been.calledWith', {
      text: 'Error: Could not find DAR-MISSING collection',
    })
  })
})

describe('cancelCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (_c: DarCollectionSummary) => {}
    const callback = cancelCollectionFn({ updateCollections, role: 'Admin' })
    cy.wrap(callback).should('exist')
  })

  it('updates collections and filteredList on successful cancel', () => {
    let collections = asCollections([{ status: 'In Progress', darCode: 'DAR-1', darCollectionId: 1 }])
    const updatedCollection = asCollection({ status: 'Complete', darCode: 'DAR-1', darCollectionId: 1 })
    const updateCollections = (collection: DarCollectionSummary) => {
      collections = [collection]
    }
    const callback = cancelCollectionFn({ updateCollections, role: 'Admin' })
    cy.stub(Collections, 'cancelCollection').returns(undefined)
    cy.stub(Collections, 'getCollectionSummaryByRoleNameAndId').returns(updatedCollection)
    cy.stub(Notifications, 'showSuccess').returns(undefined)
    cy.stub(Notifications, 'showError').returns(undefined)

    cy.wrap(callback({ darCode: 'DAR-1', darCollectionId: 1 })).then(() => {
      cy.wrap(collections).should('not.be.empty')
      cy.wrap(collections[0].darCollectionId).should('equal', 1)
      cy.wrap(collections[0].status).should('equal', 'Complete')
    })
  })

  it('shows error notification on cancel failure', () => {
    cy.stub(Collections, 'cancelCollection').rejects(new Error('network error'))
    cy.stub(Notifications, 'showError').returns(undefined)

    const callback = cancelCollectionFn({ updateCollections: () => {}, role: 'Admin' })
    cy.wrap(callback({ darCode: 'DAR-1', darCollectionId: 1 })).then(() => {
      cy.wrap(Notifications.showError).should('have.been.calledWith', { text: 'Error canceling DAR-1' })
    })
  })
})

describe('openCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const updateCollections = (_c: DarCollectionSummary) => {}
    const callback = openCollectionFn({ updateCollections, role: 'Admin' })
    cy.wrap(callback).should('exist')
  })

  it('updates collections on a successful open', () => {
    let collections = asCollections([{ status: 'Complete', darCode: 'DAR-1', darCollectionId: 1 }])
    const updatedCollection = asCollection({ status: 'In Progress', darCode: 'DAR-1', darCollectionId: 1 })
    cy.stub(Collections, 'openElectionsById').returns({})
    cy.stub(Collections, 'getCollectionSummaryByRoleNameAndId').returns(updatedCollection)
    const updateCollections = (collection: DarCollectionSummary) => {
      collections = [collection]
    }
    const callback = openCollectionFn({ updateCollections, role: 'Admin' })
    cy.wrap(callback({ darCode: 'DAR-1', darCollectionId: 1 })).then(() => {
      cy.wrap(collections[0].darCode).should('equal', 'DAR-1')
      cy.wrap(collections[0].status).should('equal', 'In Progress')
    })
  })

  it('shows error notification on open failure', () => {
    cy.stub(Collections, 'openElectionsById').rejects(new Error('network error'))
    cy.stub(Notifications, 'showError').returns(undefined)

    const callback = openCollectionFn({ updateCollections: () => {}, role: 'Admin' })
    cy.wrap(callback({ darCode: 'DAR-1', darCollectionId: 1 })).then(() => {
      cy.wrap(Notifications.showError).should('have.been.calledWith', { text: 'Error opening DAR-1' })
    })
  })
})

describe('approveCollectionFn', () => {
  it('returns a callback function for consoles to use', () => {
    const callback = approveCollectionFn({ updateCollections: () => {}, role: 'Admin' })
    cy.wrap(callback).should('exist')
  })

  it('updates collection on successful approval', () => {
    let collections = asCollections([{ status: 'In Progress', darCode: 'DAR-1', darCollectionId: 1 }])
    const updatedCollection = asCollection({ status: 'Complete', darCode: 'DAR-1', darCollectionId: 1 })
    cy.stub(Collections, 'approveCollectionById').returns({})
    cy.stub(Collections, 'getCollectionSummaryByRoleNameAndId').returns(updatedCollection)
    cy.stub(Notifications, 'showSuccess').returns(undefined)

    const updateCollections = (collection: DarCollectionSummary) => {
      collections = [collection]
    }
    const callback = approveCollectionFn({ updateCollections, role: 'Admin' })
    cy.wrap(callback({ darCode: 'DAR-1', darCollectionId: 1 })).then(() => {
      cy.wrap(collections[0].status).should('equal', 'Complete')
      cy.wrap(Notifications.showSuccess).should('have.been.calledWith', { text: 'Successfully approved DAR-1' })
    })
  })

  it('shows error notification on approval failure', () => {
    cy.stub(Collections, 'approveCollectionById').rejects(new Error('network error'))
    cy.stub(Notifications, 'showError').returns(undefined)

    const callback = approveCollectionFn({ updateCollections: () => {}, role: 'Admin' })
    cy.wrap(callback({ darCode: 'DAR-2', darCollectionId: 2 })).then(() => {
      cy.wrap(Notifications.showError).should('have.been.calledWith', { text: 'Error approving DAR-2' })
    })
  })
})

describe('collapseVotesByUser', () => {
  it('does not collapse votes by different users', () => {
    const votes = [
      { userId: 1, displayName: 'John', vote: true, voteId: 1 },
      { userId: 2, displayName: 'John', vote: true, voteId: 2 },
      { userId: 3, displayName: 'Lauren', vote: true, voteId: 3 },
    ]

    const collapsedVotes = collapseVotesByUser(votes as never)
    expect(collapsedVotes).to.have.lengthOf(3)
    expect(collapsedVotes).to.deep.include({ userId: 1, voteId: 1, displayName: 'John', vote: true, rationale: null, lastUpdated: null })
    expect(collapsedVotes).to.deep.include({ userId: 2, voteId: 2, displayName: 'John', vote: true, rationale: null, lastUpdated: null })
    expect(collapsedVotes).to.deep.include({ userId: 3, voteId: 3, displayName: 'Lauren', vote: true, rationale: null, lastUpdated: null })
  })

  it('does not collapse votes by the same user with different vote values', () => {
    const votes = [
      { userId: 1, displayName: 'John', vote: true, voteId: 1 },
      { userId: 1, displayName: 'John', vote: false, voteId: 2 },
      { userId: 1, displayName: 'John', voteId: 3 },
    ]

    const collapsedVotes = collapseVotesByUser(votes as never)
    expect(collapsedVotes).to.have.lengthOf(3)
    expect(collapsedVotes).to.deep.include({ userId: 1, voteId: 1, displayName: 'John', vote: true, rationale: null, lastUpdated: null })
    expect(collapsedVotes).to.deep.include({ userId: 1, voteId: 2, displayName: 'John', vote: false, rationale: null, lastUpdated: null })
    expect(collapsedVotes).to.deep.include({ userId: 1, voteId: 3, displayName: 'John', vote: undefined, rationale: null, lastUpdated: null })
  })

  it('collapses votes by the same user without appending identical dates / rationales', () => {
    const votes = [
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', updateDate: '30000', voteId: 1 },
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', updateDate: '30000', voteId: 2 },
    ]

    const collapsedVotes = collapseVotesByUser(votes as never)
    expect(collapsedVotes).to.have.lengthOf(1)
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale\n',
      lastUpdated: `${formatDate('30000')}\n`,
    })
  })

  it('collapses votes by the same user and appends different dates', () => {
    const votes = [
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '10000', updateDate: '20000', voteId: 1 },
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '10000', updateDate: '30000', voteId: 2 },
    ]
    const collapsedVotes = collapseVotesByUser(votes as never)
    const formattedDate = `${formatDate('20000')}\n${formatDate('30000')}\n`

    expect(collapsedVotes).to.have.lengthOf(1)
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale\n',
      lastUpdated: formattedDate,
    })
  })

  it('collapses votes by the same user and appends different rationales', () => {
    const votes = [
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale1', createDate: '20000', voteId: 1 },
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale2', createDate: '20000', voteId: 2 },
    ]

    const collapsedVotes = collapseVotesByUser(votes as never)
    expect(collapsedVotes).to.have.lengthOf(1)
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      displayName: 'John',
      vote: true,
      rationale: 'rationale1\nrationale2\n',
      lastUpdated: null,
    })
  })

  it('does not append null dates / rationales', () => {
    const votes = [
      { userId: 1, displayName: 'John', vote: true, rationale: 'rationale', createDate: '20000', updateDate: '30000', voteId: 1 },
      { userId: 1, displayName: 'John', vote: true, voteId: 2 },
    ]

    const collapsedVotes = collapseVotesByUser(votes as never)
    expect(collapsedVotes).to.have.lengthOf(1)
    expect(collapsedVotes).to.deep.include({
      userId: 1,
      voteId: 1,
      vote: true,
      displayName: 'John',
      rationale: 'rationale\n',
      lastUpdated: `${formatDate('30000')}\n`,
    })
  })

  it('handles empty votes array', () => {
    const collapsedVotes = collapseVotesByUser([])
    expect(collapsedVotes).to.have.lengthOf(0)
  })
})

describe('updateFinalVote()', () => {
  it('updates votes for the target bucket in the source collection (non-RP)', () => {
    const voteIds = [1, 2, 3]
    const votePayload = { vote: true, rationale: 'test rationale' }
    const key = 'targetKey'
    let dataUseBuckets = [asBucket({ key, votes: [{ dataAccess: {
      finalVotes: [{ voteId: 1 }, { voteId: 2 }, { voteId: 4 }],
      chairpersonVotes: [{ voteId: 3 }],
    } }] })]
    const setDataUseBuckets = (newBucketArray: typeof dataUseBuckets) => {
      dataUseBuckets = newBucketArray
    }
    const updatedBuckets = updateFinalVote({ key, votePayload, voteIds, dataUseBuckets: dataUseBuckets as never, setDataUseBuckets: setDataUseBuckets as never })!

    updatedBuckets.forEach((bucket) => {
      expectVotePayloadApplied({
        votes: getBucketVotesForScope(bucket, 'dataAccess'),
        voteIds,
        votePayload,
      })
    })

    cy.wrap(dataUseBuckets).should('deep.equal', updatedBuckets)
  })

  it('updates votes for the target bucket in the source collection (rp votes)', () => {
    const voteIds = [1, 2, 3]
    const votePayload = { vote: false, rationale: 'false rationale' }
    const key = rpVoteKey
    let dataUseBuckets = [asBucket({ key, votes: [{ rp: {
      finalVotes: [{ voteId: 1 }, { voteId: 2 }, { voteId: 4 }],
      chairpersonVotes: [{ voteId: 1 }, { voteId: 2 }, { voteId: 4 }],
    } }] })]
    const setDataUseBuckets = (newBucketArray: typeof dataUseBuckets) => {
      dataUseBuckets = newBucketArray
    }
    const updatedBuckets = updateFinalVote({ key, votePayload, voteIds, dataUseBuckets: dataUseBuckets as never, setDataUseBuckets: setDataUseBuckets as never })!

    updatedBuckets.forEach((bucket) => {
      expectVotePayloadApplied({
        votes: getBucketVotesForScope(bucket, 'rp'),
        voteIds,
        votePayload,
      })
    })

    cy.wrap(dataUseBuckets).should('deep.equal', updatedBuckets)
  })

  it('returns undefined when votePayload is empty', () => {
    const result = updateFinalVote({
      key: 'someKey',
      votePayload: {},
      voteIds: [1],
      dataUseBuckets: [] as never,
      setDataUseBuckets: () => {},
    })
    expect(result).to.equal(undefined)
  })

  it('is case-insensitive when matching bucket key', () => {
    const voteIds = [1]
    const votePayload = { vote: true, rationale: 'test' }
    const key = 'RUS VOTE' // uppercase version of rpVoteKey
    let dataUseBuckets = [asBucket({ key: rpVoteKey, votes: [{ rp: {
      finalVotes: [{ voteId: 1 }],
      chairpersonVotes: [],
    } }] })]
    const setDataUseBuckets = (newBucketArray: typeof dataUseBuckets) => {
      dataUseBuckets = newBucketArray
    }
    const updatedBuckets = updateFinalVote({ key, votePayload, voteIds, dataUseBuckets: dataUseBuckets as never, setDataUseBuckets: setDataUseBuckets as never })!

    expect(updatedBuckets).to.have.lengthOf(1)
  })
})

describe('consoleTypes', () => {
  it('has the expected console type values', () => {
    expect(consoleTypes.ADMIN).to.equal('admin')
    expect(consoleTypes.MEMBER).to.equal('member')
    expect(consoleTypes.MANAGE_ACCESS).to.equal('manageAccess')
    expect(consoleTypes.CHAIR).to.equal('chair')
    expect(consoleTypes.SIGNING_OFFICIAL).to.equal('signingOfficial')
    expect(consoleTypes.RESEARCHER).to.equal('researcher')
  })
})

describe('DarCollectionTableColumnOptions', () => {
  it('has the expected column option values', () => {
    expect(DarCollectionTableColumnOptions.DAR_CODE).to.equal('darCode')
    expect(DarCollectionTableColumnOptions.DAC).to.equal('dacNames')
    expect(DarCollectionTableColumnOptions.NAME).to.equal('name')
    expect(DarCollectionTableColumnOptions.SUBMISSION_DATE).to.equal('submissionDate')
    expect(DarCollectionTableColumnOptions.RESEARCHER).to.equal('researcher')
    expect(DarCollectionTableColumnOptions.INSTITUTION).to.equal('institution')
    expect(DarCollectionTableColumnOptions.DATASET_COUNT).to.equal('datasetCount')
    expect(DarCollectionTableColumnOptions.STATUS).to.equal('status')
    expect(DarCollectionTableColumnOptions.ACTIONS).to.equal('actions')
  })
})
