import { ElectionStatus, VOTE_TYPES } from 'src/utils/DarUtils'
import { DataAccessRequest as DataAccessRequestModel, Dataset, Election } from 'src/types/model'

const NO_ELECTION_STATUS = 'Awaiting Election Opening'
const NO_FINAL_VOTE_STATUS = 'Awaiting Final Vote'
const PENDING_STATUS = 'Pending'

export interface VoteRecord {
  datasetId: number
  datasetName: string
  voteDate: string
  voteDateRaw: string | number | null
  requestType: string
  linkedDarId: string
  voteResult: { decision: string, rationale: string }
  status: string
}

const createVoteRecord = (dar: DataAccessRequestModel, datasetId: number, election: Election | undefined, datasets: Dataset[]): VoteRecord => {
  const getElectionVotes = (election: Election | undefined) => {
    if (Array.isArray(election?.votes)) {
      return election.votes
    }
    return election?.votes ? Object.values(election.votes) : []
  }

  const votes = getElectionVotes(election)

  const finalVote = votes.find(v => v.type === VOTE_TYPES.FINAL || v.type === VOTE_TYPES.RADAR_APPROVE)
  const hasFinalVote = finalVote?.vote !== undefined && finalVote?.vote !== null
  const hasFinalVoteRationale = hasFinalVote && typeof finalVote?.rationale === 'string' && finalVote.rationale.trim().length > 0

  const dataset = datasets.find(d => d.datasetId === datasetId)
  const datasetName = dataset?.name ?? NO_ELECTION_STATUS

  const formatDate = (dateString: string | number): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isElectionClosed = !hasFinalVote && (election?.status === ElectionStatus.CLOSED || election?.status === 'Canceled')

  // The row's date and its sort key are the same value, so neither can contradict the other.
  const voteDateRaw = hasFinalVote
    ? (finalVote?.updateDate ?? finalVote?.createDate ?? null)
    : (isElectionClosed ? (election?.createDate ?? null) : null)

  const getDecision = () => {
    if (finalVote?.vote === true) {
      return 'Approved'
    }
    if (finalVote?.vote === false) {
      return 'Denied'
    }
    if (isElectionClosed && election) {
      return election.status
    }
    return PENDING_STATUS
  }

  const getRationale = () => {
    if (hasFinalVoteRationale) {
      return finalVote?.rationale ?? ''
    }
    if (hasFinalVote) {
      return 'No rationale provided.'
    }
    if (isElectionClosed) {
      return 'Election Closed - No Final Vote'
    }
    return NO_FINAL_VOTE_STATUS
  }

  return {
    datasetId,
    datasetName,
    voteDate: voteDateRaw === null ? NO_FINAL_VOTE_STATUS : formatDate(voteDateRaw),
    voteDateRaw,
    requestType: dar.progressReport ? 'Progress Report' : 'Initial DAR',
    linkedDarId: String(dar.collectionId),
    voteResult: { decision: getDecision(), rationale: getRationale() },
    status: election?.status ?? NO_ELECTION_STATUS,
  }
}

export const buildVoteRecords = (dars: DataAccessRequestModel[], datasets: Dataset[]): VoteRecord[] => dars.flatMap((dar) => {
  const elections = dar.elections
    ? Object.values(dar.elections).filter(e => e.electionType === 'DataAccess')
    : []

  return (dar.datasetIds || []).map((datasetId) => {
    const election = elections.find(e => e.datasetId === datasetId)
    return createVoteRecord(dar, datasetId, election, datasets)
  })
}).sort((a, b) => {
  // Rows with no recorded vote date first (null rather than falsy, so an epoch of 0 still
  // counts), then most recent vote, then open elections before closed, then request type,
  // then dataset name.
  if (a.voteDateRaw !== null && b.voteDateRaw !== null) {
    const dateCompare = new Date(b.voteDateRaw).getTime() - new Date(a.voteDateRaw).getTime()
    if (dateCompare !== 0) return dateCompare
  }
  else if (a.voteDateRaw === null && b.voteDateRaw !== null) return -1
  else if (a.voteDateRaw !== null && b.voteDateRaw === null) return 1

  const statusOrder: Record<string, number> = { [ElectionStatus.OPEN]: 0, [ElectionStatus.CLOSED]: 1, [NO_ELECTION_STATUS]: 2 }
  const statusCompare = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  if (statusCompare !== 0) return statusCompare

  const typeCompare = a.requestType.localeCompare(b.requestType)
  if (typeCompare !== 0) return typeCompare

  return a.datasetName.localeCompare(b.datasetName)
})

export const getDarStatus = (votes: Pick<VoteRecord, 'status'>[]): string => {
  if (votes.some(vote => vote.status === ElectionStatus.OPEN)) {
    return ElectionStatus.OPEN
  }
  if (votes.every(vote => vote.status === NO_ELECTION_STATUS)) {
    return NO_ELECTION_STATUS
  }
  return ElectionStatus.CLOSED
}
