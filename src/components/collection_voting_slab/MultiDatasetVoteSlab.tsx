import React, { useMemo, useState } from 'react'
import { get, isEmpty, isNil } from 'src/utils/NodashUtil'
import { Storage } from 'src/libs/storage'
import { convertLabelToKey } from 'src/libs/utils'
import { extractDacDataAccessVotesFromBucket, extractUserDataAccessVotesFromBucket } from 'src/utils/DarCollectionUtils'
import { AlgorithmResult, DacTerm, DarCollection, Dataset, DataUse, Election, Vote } from 'src/types/model'

// Components
import CollectionSubmitVoteBox from 'src/components/collection_vote_box/CollectionSubmitVoteBox'
import DatasetsRequestedPanel from 'src/components/collection_voting_slab/DatasetsRequestedPanel'
import { ChairVoteInfo } from 'src/components/collection_voting_slab/ChairVoteInfo'
import CollectionAlgorithmDecision from 'src/components/CollectionAlgorithmDecision'
import { Alert } from 'src/components/Alert'
import { DataUsePills } from 'src/components/collection_voting_slab/DataUsePill'
import MemberVoteSummary from 'src/components/collection_voting_slab/MemberVoteSummary'

// Types
type Bucket = {
  key: string
  algorithmResult?: AlgorithmResult
  datasets: Dataset[]
  elections: Election[]
  dataUses?: DataUse[]
  dacs?: DacTerm[]
}

interface MultiDatasetVoteSlabProps {
  readonly title: string
  readonly bucket: Bucket
  readonly collection: DarCollection
  readonly dacDatasetIds?: number[]
  readonly isApprovalDisabled: boolean
  readonly isLoading: boolean
  readonly readOnly: boolean
  readonly adminPage: boolean
  readonly updateFinalVote: (...args: unknown[]) => void
  readonly reloadFn: (...args: unknown[]) => void
}

interface DataUseSummaryProps {
  readonly bucket: Bucket
}

interface VoteInfoSubsectionProps {
  readonly currentUserVotes: Vote[]
  readonly bucket: Bucket
  readonly isChair: boolean
  readonly roleLabel?: string
  readonly isApprovalDisabled: boolean
  readonly isLoading: boolean
  readonly readOnly: boolean
  readonly adminPage: boolean
  readonly updateFinalVote: (...args: unknown[]) => void
  readonly reloadFn: (...args: unknown[]) => void
}

// Styles
const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    borderRadius: '0 8px 8px 8px',
    border: '#84a3db 2px solid',
    padding: '0.9rem 1.1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    columnGap: '1.4rem',
    alignItems: 'start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    rowGap: '0.4rem',
    minWidth: 0,
  },
  columnBordered: {
    display: 'flex',
    flexDirection: 'column' as const,
    rowGap: '0.4rem',
    minWidth: 0,
    borderLeft: '1px solid rgba(31, 59, 80, 0.15)',
    paddingLeft: '1.1rem',
  },
  columnHeading: {
    fontWeight: 800,
    fontSize: 13,
    color: '#333F52',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  },
  voteLabel: {
    fontWeight: 400,
    fontSize: 13,
    color: '#333F52',
  },
  voteInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    rowGap: '0.4rem',
  },
  chairVoteSectionDivider: {
    borderTop: '1px solid rgba(31, 59, 80, 0.15)',
    paddingTop: '0.6rem',
    marginTop: '0.2rem',
  },
  dataUses: {},
  // Columns 3 ("My DAC's Votes") and 4 ("DUOS Algorithm") share this sub-grid so the vote detail
  // table can expand to span both of them while still sitting immediately below the pie chart when
  // collapsed - a plain 4-column grid row would size to the tallest column (the Vote column) and
  // leave a visual gap before the detail table instead.
  dacAndAlgorithmWrapper: {
    gridColumn: '3 / span 2',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    columnGap: '1.4rem',
    rowGap: '0.4rem',
    alignItems: 'start',
  },
  memberVoteDetailWrapper: {
    gridColumn: '1',
  },
  memberVoteDetailWrapperExpanded: {
    gridColumn: '1 / span 2',
  },
}

// Components
const DataUseSummary = ({ bucket }: DataUseSummaryProps) => {
  const dataUses = get(bucket, 'dataUses', [])
  return isNil(dataUses) ? <></> : <div className="data-use-summary" style={styles.dataUses}><DataUsePills dataUses={dataUses} /></div>
}

const VoteInfoSubsection = ({
  currentUserVotes,
  bucket,
  isChair,
  roleLabel,
  isApprovalDisabled,
  isLoading,
  readOnly,
  adminPage,
  updateFinalVote,
  reloadFn,
}: VoteInfoSubsectionProps) => {
  const electionIds = new Set(currentUserVotes.map(vote => vote.electionId))
  const allOpenElections = bucket.elections
    .filter(election => electionIds.has(election.electionId))
    .filter(election => election.status?.toLowerCase() === 'open')

  return (
    <div style={styles.voteInfo}>
      {!adminPage && !allOpenElections && !readOnly && (
        <Alert
          id="vote-disabled-alert"
          description="Voting is disabled since this election is not open."
          title="Voting is disabled since this election is not open."
          type="danger"
        />
      )}
      <CollectionSubmitVoteBox
        votes={currentUserVotes}
        isFinal={isChair}
        isDisabled={adminPage || readOnly || isEmpty(currentUserVotes) || !allOpenElections}
        isApprovalDisabled={isApprovalDisabled}
        isLoading={isLoading}
        adminPage={adminPage}
        bucketKey={convertLabelToKey(get(bucket, 'key', 'collection-submit-vote-box'))}
        updateFinalVote={updateFinalVote}
        reloadFn={reloadFn}
        roleLabel={roleLabel}
      />
    </div>
  )
}

// Main Component
export default function MultiDatasetVoteSlab({
  bucket,
  collection,
  dacDatasetIds,
  isApprovalDisabled,
  isLoading,
  readOnly,
  adminPage,
  updateFinalVote,
  reloadFn,
}: MultiDatasetVoteSlabProps) {
  const dacVotes = useMemo(
    () => extractDacDataAccessVotesFromBucket(bucket, Storage.getCurrentUser(), adminPage),
    [bucket, adminPage],
  )
  const memberVotes = useMemo(
    () => extractUserDataAccessVotesFromBucket(bucket, Storage.getCurrentUser(), false, adminPage),
    [bucket, adminPage],
  )
  const chairVotes = useMemo(
    () => extractUserDataAccessVotesFromBucket(bucket, Storage.getCurrentUser(), true, adminPage),
    [bucket, adminPage],
  )
  const isDMI = useMemo(() => {
    const sorted = Object.values(collection.dars).sort(
      (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime(),
    )
    const darData = sorted.at(0)?.data
    return !!(darData && Object.keys(darData).includes('dmi'))
  }, [collection.dars])
  const [memberVoteDetailExpanded, setMemberVoteDetailExpanded] = useState(false)
  const { algorithmResult } = bucket
  const hasMemberVotes = !isEmpty(memberVotes)
  const hasChairVotes = !isEmpty(chairVotes)

  const getMemberVoteSectionTitle = () => {
    if (adminPage) return 'DAC Member Votes'
    if (!isEmpty(chairVotes)) return 'My DAC\'s Votes (Detail)'
    return 'Other DAC Member\'s Votes'
  }

  return (
    <div style={styles.baseStyle} data-cy="dataset-vote-slab">
      <DatasetsRequestedPanel dacDatasetIds={dacDatasetIds} bucketDatasets={bucket.datasets} dacs={bucket.dacs} isLoading={isLoading} adminPage={adminPage} />
      <div style={styles.grid}>
        <div style={styles.column}>
          <span style={styles.columnHeading}>Data Use Terms</span>
          <DataUseSummary bucket={bucket} />
        </div>
        <div style={styles.columnBordered}>
          {(hasMemberVotes || hasChairVotes) && (
            <span style={styles.columnHeading}>Should data access be granted?</span>
          )}
          <span style={styles.voteLabel}>Vote:</span>
          {hasMemberVotes && (
            <VoteInfoSubsection currentUserVotes={memberVotes} bucket={bucket} isChair={false} roleLabel="Member" isApprovalDisabled={false} isLoading={isLoading} readOnly={readOnly} adminPage={adminPage} updateFinalVote={updateFinalVote} reloadFn={reloadFn} />
          )}
          {hasChairVotes && (
            <div
              className={hasMemberVotes ? 'chair-vote-divider' : undefined}
              style={hasMemberVotes ? styles.chairVoteSectionDivider : undefined}
            >
              <VoteInfoSubsection currentUserVotes={chairVotes} bucket={bucket} isChair={true} roleLabel="Chair" isApprovalDisabled={isApprovalDisabled} isLoading={isLoading} readOnly={readOnly} adminPage={adminPage} updateFinalVote={updateFinalVote} reloadFn={reloadFn} />
            </div>
          )}
        </div>
        <div style={styles.dacAndAlgorithmWrapper}>
          <div style={styles.columnBordered}>
            <ChairVoteInfo dacVotes={dacVotes} isChair={!isEmpty(chairVotes)} adminPage={adminPage} />
          </div>
          <div style={styles.columnBordered}>
            {!isDMI && !isEmpty(algorithmResult) && (
              <CollectionAlgorithmDecision algorithmResult={algorithmResult} />
            )}
          </div>
          <div style={memberVoteDetailExpanded ? styles.memberVoteDetailWrapperExpanded : styles.memberVoteDetailWrapper}>
            <MemberVoteSummary
              dacVotes={dacVotes}
              title={getMemberVoteSectionTitle()}
              isLoading={isLoading}
              adminPage={adminPage}
              isChair={!isEmpty(chairVotes)}
              expanded={memberVoteDetailExpanded}
              onToggle={() => setMemberVoteDetailExpanded(expanded => !expanded)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
