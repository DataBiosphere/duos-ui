import React from 'react'
import { get, isEmpty, isNil } from 'lodash'
import { Storage } from 'src/libs/storage'
import { convertLabelToKey } from 'src/libs/utils'
import { extractDacDataAccessVotesFromBucket, extractUserDataAccessVotesFromBucket } from 'src/utils/DarCollectionUtils'
import { DacTerm, DarCollection, Dataset, DataUse, Election, Vote } from 'src/types/model'

// Components
import CollectionSubmitVoteBox from 'src/components/collection_vote_box/CollectionSubmitVoteBox'
import DatasetsRequestedPanel from 'src/components/collection_voting_slab/DatasetsRequestedPanel'
import { ChairVoteInfo } from 'src/components/collection_voting_slab/ResearchProposalVoteSlab'
import CollectionAlgorithmDecision from 'src/components/CollectionAlgorithmDecision'
import { Alert } from 'src/components/Alert'
import { DataUsePills } from 'src/components/collection_voting_slab/DataUsePill'
import MemberVoteSummary from 'src/components/collection_voting_slab/MemberVoteSummary'

// Types
type Bucket = {
  key: string
  algorithmResult?: unknown
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
  readonly isChair: boolean
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
    padding: '20px',
    td: {
      padding: '10px 10px 20px 20px',
    },
  },
  slabTitle: {
    display: 'flex',
    paddingBottom: '15px',
  },
  slatTitleText: {
    display: 'flex',
    fontSize: 17,
    fontWeight: 800,
    height: '32px',
    paddingLeft: '-10%',
    color: '#333F52',
    marginTop: '-5px',
    columnGap: '2rem',
  },
  question: {
    fontSize: 17,
    color: '#333F52',
    marginLeft: '30px',
  },
  dataUses: {},
  voteInfo: {},
  chairVoteInfo: {},
}

// Components
const DataUseSummary = ({ bucket }: DataUseSummaryProps) => {
  const dataUses = get(bucket, 'dataUses', [])
  return isNil(dataUses) ? <></> : <div style={styles.dataUses}>{DataUsePills(dataUses)}</div>
}

const VoteInfoSubsection = ({
  currentUserVotes,
  bucket,
  isChair,
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
      <div>
        {!adminPage && !allOpenElections && !readOnly && (
          <Alert
            id="vote-disabled-alert"
            description="Voting is disabled since this election is not open."
            title="Voting is disabled since this election is not open."
            type="danger"
          />
        )}
      </div>
      <div>
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
        />
      </div>
    </div>
  )
}

// Main Component
export default function MultiDatasetVoteSlab({
  title,
  bucket,
  collection,
  dacDatasetIds,
  isChair,
  isApprovalDisabled,
  isLoading,
  readOnly,
  adminPage,
  updateFinalVote,
  reloadFn,
}: MultiDatasetVoteSlabProps) {
  const { algorithmResult } = bucket
  const getMemberVoteSectionTitle = () => {
    if (adminPage) return 'DAC Member Votes'
    if (isChair) return 'My DAC Member\'s Votes (detail)'
    return 'Other DAC Member\'s Votes'
  }

  const isDMI = React.useMemo(() => {
    const sorted = Object.values(collection.dars).sort(
      (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime(),
    )
    const mostRecentDar = sorted.at(0)
    const darData = mostRecentDar?.data

    return darData && Object.keys(darData).includes('dmi')
  }, [collection.dars])

  const { dacVotes, currentUserVotes } = React.useMemo(() => {
    const user = Storage.getCurrentUser()
    return {
      dacVotes: extractDacDataAccessVotesFromBucket(bucket, user, adminPage),
      currentUserVotes: extractUserDataAccessVotesFromBucket(bucket, user, isChair, adminPage),
    }
  }, [bucket, isChair, adminPage])

  return (
    <div style={styles.baseStyle} data-cy="dataset-vote-slab">
      <div style={{ display: 'inline' }}>
        <table className="layout-table" style={{ width: '-webkit-fill-available' }}>
          <thead><tr><th /></tr></thead>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'text-top' }}>
                <div style={styles.slabTitle} key={convertLabelToKey(get(bucket, 'key', 'slab-title'))}>
                  <span style={styles.slatTitleText}>{title}</span>
                </div>
                <DataUseSummary bucket={bucket} />
              </td>
              <td style={{ width: '50%', verticalAlign: 'text-top' }}>
                <div style={styles.question}>
                  <p>Should data access be granted to this applicant?</p>
                </div>
                <VoteInfoSubsection
                  currentUserVotes={currentUserVotes}
                  bucket={bucket}
                  isChair={isChair}
                  isApprovalDisabled={isApprovalDisabled}
                  isLoading={isLoading}
                  readOnly={readOnly}
                  adminPage={adminPage}
                  updateFinalVote={updateFinalVote}
                  reloadFn={reloadFn}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'text-top' }}>
                <ChairVoteInfo
                  dacVotes={dacVotes}
                  isChair={isChair}
                  adminPage={adminPage}
                />
              </td>
              <td style={{ width: '50%', verticalAlign: 'text-top' }}>
                {!isDMI && !isEmpty(algorithmResult) && (
                  <CollectionAlgorithmDecision algorithmResult={algorithmResult} />
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ paddingLeft: '20px' }}>
          <MemberVoteSummary
            dacVotes={dacVotes}
            title={getMemberVoteSectionTitle()}
            isLoading={isLoading}
            adminPage={adminPage}
            isChair={isChair}
          />
        </div>

        <DatasetsRequestedPanel
          dacDatasetIds={dacDatasetIds}
          bucketDatasets={bucket.datasets}
          dacs={bucket.dacs}
          isLoading={isLoading}
          adminPage={adminPage}
        />
      </div>
    </div>
  )
}
