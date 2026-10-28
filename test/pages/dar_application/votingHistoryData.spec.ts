import { describe, it, expect } from 'vitest'
import { buildVoteRecords } from 'src/pages/dar_application/votingHistoryData'
import { DataAccessRequest, Dataset } from 'src/types/model'

const datasets = [
  { datasetId: 1, name: 'Dataset A' },
  { datasetId: 2, name: 'Dataset B' },
] as Dataset[]

// Only the fields the voting history reads are stubbed, so each fixture needs a bridging cast
// rather than a fully-populated DAR, election and vote.
const buildDar = (datasetIds: number[], elections: Record<string, unknown>, id = 1, progressReport = false) => ({
  id,
  progressReport,
  collectionId: 7,
  datasetIds,
  elections,
} as unknown as DataAccessRequest)

const closedElection = (datasetId: number, votes: Record<string, unknown>[], createDate?: string | number) => ({
  electionType: 'DataAccess',
  status: 'Closed',
  datasetId,
  createDate,
  votes,
})

describe('buildVoteRecords', () => {
  it('numbers each progress report as the Full DAR tab does', () => {
    const initial = buildDar([1], {}, 5)
    const second = buildDar([2], {}, 9, true)
    const first = buildDar([1], {}, 7, true)

    const records = buildVoteRecords([second, first, initial], datasets)

    expect(records.map(r => r.requestType).toSorted()).toEqual(['Initial DAR', 'Progress Report 1', 'Progress Report 2'])
  })

  it('labels each original DAR of a pre-2022 collection as an initial DAR', () => {
    const records = buildVoteRecords([buildDar([1], {}, 10), buildDar([2], {}, 11), buildDar([1], {}, 12, true)], datasets)

    expect(records.map(r => r.requestType).toSorted()).toEqual(['Initial DAR', 'Initial DAR', 'Progress Report 1'])
  })

  it('orders progress reports by number when their rows tie on everything else', () => {
    const dars = Array.from({ length: 11 }, (_, i) => buildDar([1], {}, i + 1, i > 0))

    const records = buildVoteRecords(dars, datasets)

    expect(records.map(r => r.requestType).slice(-2)).toEqual(['Progress Report 9', 'Progress Report 10'])
  })

  it('leaves a final vote that has not been cast undated', () => {
    const dar = buildDar([1], { one: closedElection(1, [{ type: 'FINAL', vote: null, createDate: '2024-06-01T12:00:00Z' }]) })

    const [record] = buildVoteRecords([dar], datasets)

    expect(record.voteDateRaw).toBeNull()
    expect(record.voteDate).toBe('Awaiting Final Vote')
  })

  it('says an election is still to open when the dataset has none', () => {
    const dar = buildDar([1], {})

    const [record] = buildVoteRecords([dar], datasets)

    expect(record.voteDateRaw).toBeNull()
    expect(record.voteDate).toBe('Awaiting Election Opening')
    expect(record.voteResult.rationale).toBe('Awaiting Election Opening')
  })

  it('dates a cast final vote by when it was created if it was never updated', () => {
    const dar = buildDar([1], { one: closedElection(1, [{ type: 'FINAL', vote: true, createDate: '2024-06-03T12:00:00Z' }]) })

    const [record] = buildVoteRecords([dar], datasets)

    expect(record.voteDate).toBe('June 3, 2024')
  })

  it('falls back to the election date when a closed election has no final vote', () => {
    const dar = buildDar([1], { one: closedElection(1, [], '2024-06-05T12:00:00Z') })

    const [record] = buildVoteRecords([dar], datasets)

    expect(record.voteDate).toBe('June 5, 2024')
  })

  it('treats an epoch of 0 as a real date rather than a missing one', () => {
    const dar = buildDar([1, 2], {
      one: closedElection(1, [{ type: 'FINAL', vote: true, updateDate: 0 }]),
      two: closedElection(2, []),
    })

    const [first, second] = buildVoteRecords([dar], datasets)

    // The rendered day depends on the runner's time zone, so assert only that 0 is kept and
    // read as a date rather than as a missing one.
    expect(first.voteDateRaw).toBeNull()
    expect(second.voteDateRaw).toBe(0)
    expect(second.voteDate).not.toBe('Awaiting Final Vote')
    expect(second.voteDate).toMatch(/19(69|70)/)
  })
})
