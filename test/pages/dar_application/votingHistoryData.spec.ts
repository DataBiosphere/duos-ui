import { describe, it, expect } from 'vitest'
import { buildVoteRecords } from 'src/pages/dar_application/votingHistoryData'
import { DataAccessRequest, Dataset } from 'src/types/model'

const datasets = [
  { datasetId: 1, name: 'Dataset A' },
  { datasetId: 2, name: 'Dataset B' },
] as Dataset[]

// Only the fields the voting history reads are stubbed, so each fixture needs a bridging cast
// rather than a fully-populated DAR, election and vote.
const buildDar = (datasetIds: number[], elections: Record<string, unknown>) => ({
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
