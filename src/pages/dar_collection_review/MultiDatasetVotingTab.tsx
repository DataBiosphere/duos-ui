import React, { useEffect, useState } from 'react'
import { filter, find, get, isNil } from 'src/utils/NodashUtil'
import { Alert } from 'src/components/Alert'
import AILLMWarningBanner from 'src/components/AILLMWarningBanner'
import MultiDatasetVoteSlab from 'src/components/collection_voting_slab/MultiDatasetVoteSlab'
import ResearchProposalVoteSlab from 'src/components/collection_voting_slab/ResearchProposalSlab'
import { User } from 'src/libs/ajax/User'
import { Bucket } from 'src/utils/BucketUtils'
import { DarCollection, DataAccessRequestData } from 'src/types/model'

interface MultiDatasetVotingTabProps {
  readonly darInfo: Partial<DataAccessRequestData>
  readonly buckets: Bucket[]
  readonly collection: DarCollection | Record<string, never>
  readonly isChair?: boolean
  readonly isLoading?: boolean
  readonly readOnly?: boolean
  readonly adminPage?: boolean
  readonly updateFinalVote?: (...args: unknown[]) => void
  readonly reloadFn?: (...args: unknown[]) => void
}

interface DatasetVoteSlabsProps {
  readonly dataBuckets: Bucket[]
  readonly collection: DarCollection | Record<string, never>
  readonly dacDatasetIds: number[]
  readonly isApprovalDisabled: boolean
  readonly readOnly: boolean
  readonly adminPage: boolean
  readonly updateFinalVote: (...args: unknown[]) => void
  readonly isLoading: boolean
  readonly reloadFn: (...args: unknown[]) => void
}

const DatasetVoteSlabs = ({
  dataBuckets,
  collection,
  dacDatasetIds,
  isApprovalDisabled,
  readOnly,
  adminPage,
  updateFinalVote,
  isLoading,
  reloadFn,
}: DatasetVoteSlabsProps): React.ReactNode => {
  return dataBuckets.map(bucket => (
    <MultiDatasetVoteSlab
      title={bucket.label}
      bucket={bucket as never}
      collection={collection as DarCollection}
      dacDatasetIds={dacDatasetIds}
      isApprovalDisabled={isApprovalDisabled}
      readOnly={readOnly}
      key={bucket.key}
      adminPage={adminPage}
      updateFinalVote={updateFinalVote}
      isLoading={isLoading}
      reloadFn={reloadFn}
    />
  ))
}

const styles = {
  baseStyle: {
    backgroundColor: '#FFFFFF',
    padding: 'clamp(1.2rem, 2.5vw, 1.5rem) clamp(1rem, 3.5vw, 3.5rem) clamp(1.5rem, 3.5vw, 3.5rem)',
    whiteSpace: 'pre-line' as const,
  },
  slabs: {
    display: 'flex',
    flexDirection: 'column' as const,
    rowGap: '35px',
  },
  title: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: 'bold',
    paddingBottom: '20px',
    paddingTop: '35px',
  },
  firstTitle: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: 'bold',
    paddingBottom: '20px',
    paddingTop: '15px',
  },
}

export default function MultiDatasetVotingTab({
  darInfo,
  buckets,
  collection,
  isChair = false,
  isLoading = false,
  readOnly = false,
  adminPage = false,
  updateFinalVote = () => {},
  reloadFn = () => {},
}: MultiDatasetVotingTabProps) {
  const [dacDatasetIds, setDacDatasetIds] = useState<number[]>([])

  const missingLibraryCardMessage = 'The Researcher must have a Library Card before data access can be granted.\n'
    + (adminPage ? '' : 'You can still deny this request and/or vote on the Structured Research Purpose.')

  const rpBucket = find(buckets, bucket => get(bucket, 'isRP')) ?? {} as Bucket
  const dataBuckets = filter(buckets, bucket => get(bucket, 'isRP') !== true) as Bucket[]

  useEffect(() => {
    const init = async () => {
      const dacDatasets = adminPage ? [] : await User.getUserRelevantDatasets()
      const datasetIds = dacDatasets
        .map(dataset => dataset.datasetId)
        .filter((id): id is number => !isNil(id))
      setDacDatasetIds(datasetIds)
    }
    init()
  }, [adminPage])

  const dataAccessApprovalDisabled = (): boolean => {
    const researcherLibraryCard = get(collection, 'createUser.libraryCard')
    const researcherMissingLibraryCards = isNil(researcherLibraryCard)
    return isChair && researcherMissingLibraryCards
  }

  return (
    <div style={styles.baseStyle}>
      <AILLMWarningBanner darInfo={darInfo} />
      <div style={styles.firstTitle}>Research Use Statement</div>
      {dataAccessApprovalDisabled() && !readOnly && (
        <Alert
          type="danger"
          title={missingLibraryCardMessage}
          description=""
          id="missing_lc"
        />
      )}
      <ResearchProposalVoteSlab
        updateFinalVote={updateFinalVote}
        darInfo={darInfo}
        bucket={rpBucket}
        key="rp-vote"
        isChair={isChair}
        isLoading={isLoading}
        readOnly={readOnly}
        adminPage={adminPage}
      />
      <div style={styles.title}>Datasets Requested by Data Use</div>
      <div style={styles.slabs}>
        <DatasetVoteSlabs
          dataBuckets={dataBuckets}
          collection={collection}
          dacDatasetIds={dacDatasetIds}
          isApprovalDisabled={dataAccessApprovalDisabled()}
          readOnly={readOnly}
          adminPage={adminPage}
          updateFinalVote={updateFinalVote}
          isLoading={isLoading}
          reloadFn={reloadFn}
        />
      </div>
    </div>
  )
}
