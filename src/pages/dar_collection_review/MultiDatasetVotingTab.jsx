import React from 'react';
import {useEffect, useState} from 'react';
import MultiDatasetVoteSlab from '../../components/collection_voting_slab/MultiDatasetVoteSlab';
import ResearchProposalVoteSlab from '../../components/collection_voting_slab/ResearchProposalVoteSlab';
import {find, get, filter, flow, map, isNil, isEmpty} from 'lodash/fp';
import { User } from '../../libs/ajax/User';
import {Alert} from '../../components/Alert';

export const votingColors = {
  yes: 'rgb(31, 163, 113)',
  no: 'rgb(218, 0, 3)',
  other: 'rgb(151, 151, 151)',
  default: 'rgb(255, 255, 255)'
};
const styles = {
  baseStyle: {
    backgroundColor: '#FFFFFF',
    padding: '35px',
    whiteSpace: 'pre-line'
  },
  slabs: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '35px'
  },
  title: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: 'bold',
    paddingBottom: '20px',
    paddingTop: '35px'
  }
};

export default function MultiDatasetVotingTab(props) {
  const [rpBucket, setRpBucket] = useState({});
  const [dataBuckets, setDataBuckets] = useState([]);
  const [dacDatasetIds, setDacDatasetIds] = useState([]);
  const {darInfo, buckets, collection, isChair, isLoading, readOnly, adminPage, updateFinalVote} = props;
  const missingLibraryCardMessage = 'The Researcher must have a Library Card before data access can be granted.\n' +
    (!adminPage ? 'You can still deny this request and/or vote on the Structured Research Purpose.' : '');

  useEffect(() => {
    setRpBucket(find(bucket => get('isRP')(bucket))(buckets));
    setDataBuckets(filter(bucket => get('isRP')(bucket) !== true)(buckets));
  }, [buckets, collection]);

  useEffect(() => {
    const init = async () => {
      const dacDatasets = adminPage ? [] : await User.getUserRelevantDatasets();
      const datasetIds = flow(
        map(dataset => get('datasetId')(dataset)),
        filter(datasetId => !isNil(datasetId))
      )(dacDatasets);
      setDacDatasetIds(datasetIds);
    };
    init();
  }, [adminPage]);

  const DatasetVoteSlabs = () => {
    const isApprovalDisabled = dataAccessApprovalDisabled();
    return dataBuckets.map((bucket) => (
      <MultiDatasetVoteSlab
        title={bucket.label}
        bucket={bucket}
        dacDatasetIds={dacDatasetIds}
        isChair={isChair}
        isApprovalDisabled={isApprovalDisabled}
        readOnly={readOnly}
        key={bucket.key}
        adminPage={adminPage}
        updateFinalVote={updateFinalVote}
        isLoading={isLoading}
      />
    ));
  };

  const dataAccessApprovalDisabled = () => {
    const researcherLibraryCards = flow(
      get('createUser'),
      get('libraryCards')
    )(collection);
    const researcherMissingLibraryCards = isNil(researcherLibraryCards) || isEmpty(researcherLibraryCards);
    return isChair && researcherMissingLibraryCards;
  };

  return (
    <div style={styles.baseStyle}>
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
        <DatasetVoteSlabs />
      </div>
    </div>
  );
}