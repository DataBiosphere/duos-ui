import { cloneDeep } from 'lodash'
import { Styles } from 'src/libs/theme'
import { formatDate, Notifications } from 'src/libs/utils'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollectionSummary, Election, UserRoleName, Vote } from 'src/types/model'
import { groupBy, isEmpty, isNil } from 'src/utils/NodashUtil'

export const rpVoteKey = 'RUS Vote'

interface VotesByType {
  chairpersonVotes: Vote[]
  memberVotes: Vote[]
  finalVotes: Vote[]
  agreementVotes?: Vote[]
  radarVotes?: Vote[]
}

interface ProcessedVotes extends Record<string, VotesByType> {
  rp: VotesByType
  dataAccess: VotesByType & Required<Pick<VotesByType, 'agreementVotes' | 'radarVotes'>>
}

type VoteArrayGroup = Partial<Record<'rp' | 'dataAccess', Partial<VotesByType>>>

// Helper function for processDataUseBuckets, essentially organizes votes in a dar's elections by type
export const processVotesForBucket = (darElections: Election[] = []): ProcessedVotes => {
  const rp: VotesByType = {
    chairpersonVotes: [],
    memberVotes: [],
    finalVotes: [],
  }
  const dataAccess: VotesByType & Required<Pick<VotesByType, 'agreementVotes' | 'radarVotes'>> = {
    finalVotes: [],
    memberVotes: [],
    chairpersonVotes: [],
    agreementVotes: [],
    radarVotes: [],
  }
  darElections.forEach((election) => {
    const { electionType, votes, status } = election
    const isRPElection = electionType === 'RP'
    const targetVotes = isRPElection ? rp : dataAccess
    const targetFinalType = isRPElection ? 'chairperson' : 'final'
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
          if (!isRPElection) {
            dataAccess.radarVotes.push(vote)
          }
          break
        case 'chairperson':
          targetVotes.chairpersonVotes.push(vote)
          break
        case 'dac':
          targetVotes.memberVotes.push(vote)
          break
        default:
          break
      }
      if (lowerCaseType === targetFinalType) {
        targetVotes.finalVotes.push(vote)
      }
    })
  })
  return { rp, dataAccess }
}

// Minimal shape of a bucket needed for vote extraction
export interface VoteBucket {
  [key: string]: unknown
  votes?: VoteArrayGroup[]
}

// Gets data access votes from this bucket by members of this user's DAC
// Note that filtering by DAC does not occur if user is viewing on admin review page
export const extractDacDataAccessVotesFromBucket = (bucket: VoteBucket | null | undefined, user: { userId: number }, adminPage?: boolean): Vote[] => {
  const votes = bucket?.votes ?? []

  let memberVotesArrays = votes
    .map(voteData => voteData.dataAccess)
    .filter(dataAccessData => !isEmpty(dataAccessData))
    .map(filteredData => filteredData?.memberVotes ?? [])

  if (!adminPage) {
    memberVotesArrays = filterVoteArraysForUsersDac(memberVotesArrays, user)
  }
  return memberVotesArrays.flat()
}

// Gets rp votes from this bucket by members of this user's DAC
// Note that filtering by DAC does not occur for users viewing through admin review page
export const extractDacRPVotesFromBucket = (bucket: VoteBucket | null | undefined, user: { userId: number }, adminPage?: boolean): Vote[] => {
  const votes = bucket?.votes ?? []
  let rpVoteArrays = votes
    .map(voteData => voteData.rp)
    .filter(rpData => !isEmpty(rpData))
    .map(filteredData => filteredData?.memberVotes ?? [])

  if (!adminPage) {
    rpVoteArrays = filterVoteArraysForUsersDac(rpVoteArrays, user)
  }
  return rpVoteArrays.flat()
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

// Gets this user's rp votes from this bucket; chairperson votes if isChair is true, member votes if false
// Note that filtering by DAC does not occur when viewing through the admin review page
export const extractUserRPVotesFromBucket = (
  bucket: VoteBucket | null | undefined,
  user: { userId: number },
  isChair = false,
  adminPage = false,
): Vote[] => {
  const votes = bucket?.votes ?? []
  const adminOrChair = adminPage || isChair
  const userRPVotes = votes.flatMap((voteGroup) => {
    if (adminOrChair) {
      return voteGroup.rp?.chairpersonVotes || []
    }
    else {
      return voteGroup.rp?.memberVotes || []
    }
  })
  if (adminPage) {
    return userRPVotes.filter(vote => !isNil(vote.vote))
  }
  else {
    return userRPVotes.filter(vote => vote.userId === user.userId)
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
  filterFn: (searchText: string | undefined, collections: DarCollectionSummary[]) => DarCollectionSummary[]
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
      const updatedFilteredList = filterFn(searchText, collectionsCopy)
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
export const updateFinalVote = ({
  key,
  votePayload,
  voteIds,
  dataUseBuckets,
  setDataUseBuckets,
}: {
  key: string
  votePayload: VotePayload | Record<string, unknown>
  voteIds: number[]
  dataUseBuckets: UpdatableVoteBucket[]
  setDataUseBuckets: (buckets: UpdatableVoteBucket[]) => void
}): UpdatableVoteBucket[] | undefined => {
  if (!isVotePayload(votePayload)) {
    return undefined
  }

  // clone entire bucket to trigger page re-render on bucket update (setDataUseBuckets)
  const clonedBuckets = cloneDeep(dataUseBuckets)
  const isRPBucket = key.toLowerCase() === rpVoteKey.toLowerCase()
  const targetBucket = clonedBuckets.find(bucket => bucket.key.toLowerCase() === key.toLowerCase())
  if (!targetBucket) {
    return undefined
  }
  // source of votes will differ depending on the bucket (rp vs non-rp), so determine the callback function for flow here
  const voteObjectCallback = isRPBucket
    ? (voteObj: VoteGroup) => voteObj.rp
    : (voteObj: VoteGroup) => voteObj.dataAccess
  // to keep local source of truth updated without a fetch, we will need to update both the final and the chairperson votes
  // to make searching on the votes easier, concatenate and then flatten the finalVotes and chairpersonVotes into one array
  // NOTE: For the RP bucket the chairperson votes and the final votes are the same (RP has no final vote)
  // This was a conscious choice in order to keep processing the same between RP and non-RP buckets
  const votes = targetBucket.votes
    .map(voteObjectCallback)
    .flatMap(voteObj => [...(voteObj?.finalVotes ?? []), ...(voteObj?.chairpersonVotes ?? [])])

  // perform in place update of vote and vote rationale based on voteIds arguments
  // updates to the vote here will be reflected in clonedBuckets since the vote references are the same
  votes
    .filter(vote => voteIds.includes(vote.voteId))
    .forEach((currentVote) => {
      currentVote.rationale = votePayload.rationale
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
    backgroundColor: 'B8CDD3',
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
  EXPIRES_AT: 'expiresAt',
  STATUS: 'status',
  ACTIONS: 'actions',
} as const

type VoteGroup = Record<string, VotesByType>

interface VotePayload {
  vote: boolean
  rationale: string
}

const isVotePayload = (value: VotePayload | Record<string, unknown>): value is VotePayload =>
  typeof value.vote === 'boolean' && typeof value.rationale === 'string'

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
