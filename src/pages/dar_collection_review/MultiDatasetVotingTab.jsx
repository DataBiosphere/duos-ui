import { filter, find, flow, get, isNil, map } from 'lodash/fp'
import React, { useEffect, useState } from 'react'
import { Alert } from '../../components/Alert'
import AILLMWarningBanner from 'src/components/AILLMWarningBanner'
import MultiDatasetVoteSlab from '../../components/collection_voting_slab/MultiDatasetVoteSlab'
import ResearchProposalVoteSlab from '../../components/collection_voting_slab/ResearchProposalVoteSlab'
import { User } from '../../libs/ajax/User'

const DatasetVoteSlabs = ({ dataBuckets, collection, dacDatasetIds, isChair, isApprovalDisabled, readOnly, adminPage, updateFinalVote, isLoading, reloadFn }) => {
  return dataBuckets.map(bucket => (
    <MultiDatasetVoteSlab
      title={bucket.label}
      bucket={bucket}
      collection={collection}
      dacDatasetIds={dacDatasetIds}
      isChair={isChair}
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
    padding: '35px',
    whiteSpace: 'pre-line',
  },
  slabs: {
    display: 'flex',
    flexDirection: 'column',
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
}

export default function MultiDatasetVotingTab(props) {
  const [dacDatasetIds, setDacDatasetIds] = useState([])
  const { darInfo, buckets, collection, isChair, isLoading, readOnly, adminPage, updateFinalVote, reloadFn } = props
  const missingLibraryCardMessage = 'The Researcher must have a Library Card before data access can be granted.\n'
    + (!adminPage ? 'You can still deny this request and/or vote on the Structured Research Purpose.' : '')

  const rpBucket = find(bucket => get('isRP')(bucket))(buckets) || {}
  const dataBuckets = filter(bucket => get('isRP')(bucket) !== true)(buckets)

  useEffect(() => {
    const init = async () => {
      const dacDatasets = adminPage ? [] : await User.getUserRelevantDatasets()
      const datasetIds = flow(
        map(dataset => get('datasetId')(dataset)),
        filter(datasetId => !isNil(datasetId)),
      )(dacDatasets)
      setDacDatasetIds(datasetIds)
    }
    init()
  }, [adminPage])

  const dataAccessApprovalDisabled = () => {
    const researcherLibraryCard = flow(
      get('createUser'),
      get('libraryCard'),
    )(collection)
    const researcherMissingLibraryCards = isNil(researcherLibraryCard)
    return isChair && researcherMissingLibraryCards
  }

  return (
    <div style={styles.baseStyle}>
      <AILLMWarningBanner darInfo={darInfo} />
      <div style={styles.title}>Research Use Statement</div>
      {dataAccessApprovalDisabled() && !readOnly && (
        <Alert
          type="danger"
          title={missingLibraryCardMessage}
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
          isChair={isChair}
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
