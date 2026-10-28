import { Styles } from 'src/libs/theme'
import { formatDate, Notifications } from 'src/libs/utils'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollectionSummary, Election, UserRoleName, Vote } from 'src/types/model'
import { groupBy, isNil, cloneDeep } from 'src/utils/NodashUtil'

interface VotesByType {
  chairpersonVotes: Vote[]
  memberVotes: Vote[]
  finalVotes: Vote[]
  agreementVotes?: Vote[]
  radarVotes?: Vote[]
}

interface ProcessedVotes extends Record<string, VotesByType> {
  dataAccess: VotesByType & Required<Pick<VotesByType, 'agreementVotes' | 'radarVotes'>>
}

// One entry of a bucket's votes array, as produced by processVotesForBucket
interface VoteGroup {
  dataAccess?: Partial<VotesByType>
}

// Helper function for processDataUseBuckets, essentially organizes votes in a dar's elections by type
export const processVotesForBucket = (darElections: Election[] = []): ProcessedVotes => {
  const dataAccess: VotesByType & Required<Pick<VotesByType, 'agreementVotes' | 'radarVotes'>> = {
    finalVotes: [],
    memberVotes: [],
    chairpersonVotes: [],
    agreementVotes: [],
    radarVotes: [],
  }
  darElections.forEach((election) => {
    if (election.electionType !== 'DataAccess') return
    const { votes, status } = election
    // add field to each vote object to indicate election status
    const updatedVotes = Object.values(votes).map(vote => ({
      ...vote,
      electionStatus: status,
    }))
    updatedVotes.forEach((vote) => {
      votes[vote.voteId] = vote
    })
    const dateSortedVotes = [...updatedVotes].sort((a, b) =>
      (a.updateDate ?? '') < (b.updateDate ?? '') ? -1 : 1,
    )
    dateSortedVotes.forEach((vote) => {
      const lowerCaseType = vote.type?.toLowerCase() ?? ''
      switch (lowerCaseType) {
        case 'radar_approve':
          dataAccess.radarVotes.push(vote)
          break
        case 'chairperson':
          dataAccess.chairpersonVotes.push(vote)
          break
        case 'dac':
          dataAccess.memberVotes.push(vote)
          break
        case 'final':
          dataAccess.finalVotes.push(vote)
          break
        default:
          break
      }
    })
  })
  return { dataAccess }
}

// Minimal shape of a bucket needed for vote extraction
export interface VoteBucket {
  [key: string]: unknown
  votes?: VoteGroup[]
}

// Gets data access votes from this bucket by members of this user's DAC
// Note that filtering by DAC does not occur if user is viewing on admin review page
export const extractDacDataAccessVotesFromBucket = (bucket: VoteBucket | null | undefined, user: { userId: number }, adminPage?: boolean): Vote[] => {
  const votes = bucket?.votes ?? []

  let memberVotesArrays = votes.map(voteData => voteData.dataAccess?.memberVotes ?? [])

  if (!adminPage) {
    memberVotesArrays = filterVoteArraysForUsersDac(memberVotesArrays, user)
  }
  return memberVotesArrays.flat()
}

// Applies filter to arrays of votes grouped by election and
// only keeps arrays where at least one vote has the userId of the provided user
const filterVoteArraysForUsersDac = (voteArrays: Vote[][], user: { userId: number }): Vote[][] =>
  voteArrays.filter(voteArray => voteArray.map(vote => vote.userId).includes(user.userId))

// Gets this user's data access votes from this bucket; radar, final and chairperson votes if isChair is true, member votes if false
// Note that filtering by DAC does not occur for users viewing through admin review page
export const extractUserDataAccessVotesFromBucket = (
  bucket: VoteBucket | null | undefined,
  user: { userId: number },
  isChair = false,
  adminPage = false,
): Vote[] => {
  const votes = bucket?.votes ?? []
  const adminOrChair = adminPage || isChair
  const userDataAccessVotes = votes.flatMap((voteGroup) => {
    // If admin page or chair, we want to include all final, chair, and radar votes
    if (adminOrChair) {
      const chairpersonVotes = voteGroup.dataAccess?.chairpersonVotes || []
      const finalVotes = voteGroup.dataAccess?.finalVotes || []
      const radarVotes = voteGroup.dataAccess?.radarVotes || []
      return [...chairpersonVotes, ...finalVotes, ...radarVotes]
    }
    else {
      return voteGroup.dataAccess?.memberVotes || []
    }
  })
  if (adminPage) {
    // If admin page, we want to include all votes regardless of userId
    return userDataAccessVotes
  }
  else {
    return userDataAccessVotes.filter(vote => vote.userId === user.userId)
  }
}

// collapses votes by the same user with same vote (true/false) into a singular vote with appended rationales / dates if different
export const collapseVotesByUser = (votes: Vote[]) => {
  const votesGroupedByUser = groupBy(cloneDeep(votes), vote => String(vote.userId))
  return Object.keys(votesGroupedByUser).flatMap((userIdKey) => {
    const votesByUser = votesGroupedByUser[userIdKey]
    const collapsedVotes = collapseVotes({ votes: votesByUser })
    return convertToVoteObjects({ collapsedVotes })
  })
}

// helper method to collapse votes by converting them to an object with differing rationales and dates in arrays
const collapseVotes = ({ votes }: { votes: Vote[] }): Record<string, CollapsedVoteAccumulator> => {
  const collapsedVotes: Record<string, CollapsedVoteAccumulator> = {}
  votes.forEach((vote) => {
    const matchingVote = collapsedVotes[`${vote.vote}`]
    const lastUpdate = vote.updateDate
    if (isNil(matchingVote)) {
      collapsedVotes[`${vote.vote}`] = {
        userId: vote.userId,
        vote: vote.vote,
        voteId: vote.voteId,
        displayName: vote.displayName,
        rationales: isNil(vote.rationale) ? [] : [vote.rationale],
        lastUpdates: isNil(lastUpdate) ? [] : [lastUpdate],
      }
    }
    else {
      addIfUnique(vote.rationale, matchingVote.rationales)
      addIfUnique(lastUpdate, matchingVote.lastUpdates)
    }
  })
  return collapsedVotes
}

// helper method to follow collapseVotes in flow
const convertToVoteObjects = ({ collapsedVotes }: { collapsedVotes: Record<string, CollapsedVoteAccumulator> }) =>
  Object.keys(collapsedVotes).map((key) => {
    const collapsedVote = collapsedVotes[key]
    const collapsedRationale = appendAll(collapsedVote.rationales)
    const collapsedDate = appendAll(collapsedVote.lastUpdates.map(date => formatDate(date)))

    return {
      userId: collapsedVote.userId,
      vote: collapsedVote.vote,
      voteId: collapsedVote.voteId,
      displayName: collapsedVote.displayName,
      rationale: collapsedRationale,
      lastUpdated: collapsedDate,
    }
  })

const appendAll = (values: string[]): string | null => {
  const result = values.reduce((acc, value) => acc + `${value}\n`, '')
  return result.length > 0 ? result : null
}

const addIfUnique = <T extends string | number>(newValue: T | undefined, existingValues: T[]): void => {
  if (!isNil(newValue) && !existingValues.includes(newValue)) {
    existingValues.push(newValue)
  }
}

export const updateCollectionFn = ({
  collections,
  filterFn,
  searchText,
  setCollections,
  setFilteredList,
}: {
  collections: DarCollectionSummary[]
  filterFn: (searchText: string, collections: DarCollectionSummary[]) => DarCollectionSummary[]
  searchText?: string
  setCollections: (collections: DarCollectionSummary[]) => void
  setFilteredList: (collections: DarCollectionSummary[]) => void
}) =>
  (updatedCollection: DarCollectionSummary): void => {
    const targetIndex = collections.findIndex(
      collection => collection.darCollectionId === updatedCollection.darCollectionId,
    )
    if (targetIndex < 0) {
      Notifications.showError({
        text: `Error: Could not find ${updatedCollection.darCode} collection`,
      })
    }
    else {
      const collectionsCopy = cloneDeep(collections)
      collectionsCopy[targetIndex] = updatedCollection
      const updatedFilteredList = filterFn(searchText ?? '', collectionsCopy)
      setCollections(collectionsCopy)
      setFilteredList(updatedFilteredList)
    }
  }

export const cancelCollectionFn = ({
  updateCollections,
  role,
}: {
  updateCollections: (collection: DarCollectionSummary) => void
  role: UserRoleName
}) =>
  async ({ darCode, darCollectionId }: { darCode: string, darCollectionId: number }): Promise<void> => {
    try {
      await Collections.cancelCollection(darCollectionId, role)
      const summary = await Collections.getCollectionSummaryByRoleNameAndId({
        id: darCollectionId,
        roleName: role,
      })
      updateCollections(summary)
      Notifications.showSuccess({ text: `Successfully canceled ${darCode}` })
    }
    catch {
      Notifications.showError({ text: `Error canceling ${darCode}` })
    }
  }

export const openCollectionFn = ({
  updateCollections,
  role,
}: {
  updateCollections: (collection: DarCollectionSummary) => void
  role: UserRoleName
}) =>
  async ({ darCode, darCollectionId }: { darCode: string, darCollectionId: number }): Promise<void> => {
    try {
      await Collections.openElectionsById(darCollectionId)
      const summary = await Collections.getCollectionSummaryByRoleNameAndId({
        id: darCollectionId,
        roleName: role,
      })
      updateCollections(summary)
      Notifications.showSuccess({ text: `Successfully opened ${darCode}` })
    }
    catch {
      Notifications.showError({ text: `Error opening ${darCode}` })
    }
  }

export const approveCollectionFn = ({
  updateCollections,
  role,
}: {
  updateCollections: (collection: DarCollectionSummary) => void
  role: UserRoleName
}) =>
  async ({ darCode, darCollectionId }: { darCode: string, darCollectionId: number }): Promise<void> => {
    try {
      await Collections.approveCollectionById(darCollectionId)
      const summary = await Collections.getCollectionSummaryByRoleNameAndId({
        id: darCollectionId,
        roleName: role,
      })
      updateCollections(summary)
      Notifications.showSuccess({ text: `Successfully approved ${darCode}` })
    }
    catch {
      Notifications.showError({ text: `Error approving ${darCode}` })
    }
  }

// helper function used in DarCollectionReview to update final vote on source of truth
// done to trigger re-renders on parent and child components (vote summary bar, member tab, etc.)
export const updateFinalVote = <T extends UpdatableVoteBucket>({
  key,
  votePayload,
  voteIds,
  dataUseBuckets,
  setDataUseBuckets,
}: {
  key: string
  votePayload: VotePayload | Record<string, unknown>
  voteIds: number[]
  dataUseBuckets: T[]
  setDataUseBuckets: (buckets: T[]) => void
}): T[] | undefined => {
  if (!isVotePayload(votePayload)) {
    return undefined
  }

  // clone entire bucket to trigger page re-render on bucket update (setDataUseBuckets)
  const clonedBuckets = cloneDeep(dataUseBuckets)
  const targetBucket = clonedBuckets.find(bucket => bucket.key.toLowerCase() === key.toLowerCase())
  if (!targetBucket) {
    return undefined
  }
  const votes = targetBucket.votes
    .map(voteObj => voteObj.dataAccess)
    .flatMap(voteObj => [...(voteObj?.finalVotes ?? []), ...(voteObj?.chairpersonVotes ?? [])])

  // perform in place update of vote and vote rationale based on voteIds arguments
  // updates to the vote here will be reflected in clonedBuckets since the vote references are the same
  votes
    .filter(vote => voteIds.includes(vote.voteId))
    .forEach((currentVote) => {
      if ('rationale' in votePayload) {
        currentVote.rationale = votePayload.rationale ?? undefined
      }
      currentVote.vote = votePayload.vote
    })
  // set new bucket to trigger re-render, return clonedBuckets for debugging/testing efforts
  setDataUseBuckets(clonedBuckets)
  return clonedBuckets
}

export const consoleTypes = {
  ADMIN: 'admin',
  MEMBER: 'member',
  MANAGE_ACCESS: 'manageAccess',
  CHAIR: 'chair',
  SIGNING_OFFICIAL: 'signingOfficial',
  RESEARCHER: 'researcher',
} as const

export const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    margin: '0.5% 0',
  },
  columnStyle: {
    ...Styles.TABLE.HEADER_ROW, justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    border: 'none',
  },
  cellWidth: {
    darCode: '10%',
    dacNames: '8%',
    projectTitle: '13%',
    submissionDate: '8%',
    researcher: '9%',
    institution: '11.5%',
    datasetCount: '6%',
    expirationDate: '8%',
    status: '9%',
    actions: '13%',
  },
  color: {
    darCode: '#000000',
    dacNames: '#000000',
    projectTitle: '#000000',
    submissionDate: '#000000',
    researcher: '#000000',
    institution: '#354052',
    datasetCount: '#354052',
    status: '#000000',
    actions: '#000000',
  },
  fontSize: {
    darCode: '1.6rem',
    dacNames: '1.4rem',
    projectTitle: '1.4rem',
    submissionDate: '1.4rem',
    researcher: '1.4rem',
    institution: '1.4rem',
    datasetCount: '2.0rem',
    status: '1.6rem',
    actions: '1.6rem',
  },
}

export const DarCollectionTableColumnOptions = {
  DAR_CODE: 'darCode',
  DAC: 'dacNames',
  NAME: 'name',
  SUBMISSION_DATE: 'submissionDate',
  RESEARCHER: 'researcher',
  INSTITUTION: 'institution',
  DATASET_COUNT: 'datasetCount',
  DATA_USE: 'dataUse',
  VOTES: 'votes',
  EXPIRES_AT: 'expiresAt',
  STATUS: 'status',
  ACTIONS: 'actions',
} as const

interface VotePayload {
  vote: boolean
  rationale?: string | null
}

const isVotePayload = (value: VotePayload | Record<string, unknown>): value is VotePayload =>
  typeof value.vote === 'boolean'
  && (
    value.rationale === undefined
    || value.rationale === null
    || typeof value.rationale === 'string'
  )

interface CollapsedVoteAccumulator {
  userId: number
  vote: boolean | undefined
  voteId: number
  displayName: string
  rationales: string[]
  lastUpdates: Array<string | number>
}

type UpdatableVoteBucket = {
  key: string
  votes: VoteGroup[]
}
