import {div, h} from 'react-hyperscript-helpers';
import CollectionSubmitVoteBox from '../collection_vote_box/CollectionSubmitVoteBox';
import {filter, flatMap, flow, map, isNil, isEmpty, get, includes, every, toLower} from 'lodash/fp';
import {Storage} from '../../libs/storage';
import {useEffect, useState} from 'react';
import DatasetsRequestedPanel from './DatasetsRequestedPanel';
import {ChairVoteInfo, dataUsePills} from './ResearchProposalVoteSlab';
import {
  extractDacDataAccessVotesFromBucket,
  extractDatasetIdsFromBucket, extractUserDataAccessVotesFromBucket,
} from '../../utils/DarCollectionUtils';
import {Alert} from '../Alert';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 'bold',
  },
  slabTitle: {
    color: '#000000',
    backgroundColor: '#F1EDE8',
    fontSize: '1.6rem',
    height: '32px',
    width: 'fit-content',
    padding: '1.5rem',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dataUses: {
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 4px 0 0',
    padding: '15px 25px'
  },
  voteInfo: {
    backgroundColor: '#D4E1EB',
    padding: '22px 25px'
  },
  chairVoteInfo: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '1.5rem'
  }
};

export default function MultiDatasetVoteSlab(props) {
  const [currentUserVotes, setCurrentUserVotes] = useState([]);
  const [dacVotes, setDacVotes] = useState([]);
  const [bucketDatasetIds, setBucketDatasetIds] = useState([]);
  const {title, bucket, collectionDatasets, dacDatasetIds, isChair, isApprovalDisabled, isLoading, readOnly, adminPage} = props;
  const {algorithmResult} = bucket;

  useEffect(() => {
    const user = Storage.getCurrentUser();
    setDacVotes(extractDacDataAccessVotesFromBucket(bucket, user, adminPage));
    setCurrentUserVotes(extractUserDataAccessVotesFromBucket(bucket, user, isChair, adminPage));
    setBucketDatasetIds(extractDatasetIdsFromBucket(bucket));
  }, [bucket, isChair, adminPage]);

  const DataUseSummary = () => {
    const dataUses = get('dataUses')(bucket);
    return !isNil(dataUses)
      ? div({style: styles.dataUses}, [dataUsePills(dataUses)])
      : div();
  };

  const VoteInfoSubsection = () => {
    const allOpenElections = flow(
      get('elections'),
      flatMap(election => flatMap(electionData => electionData)(election)),
      filter(electionData => includes(electionData.electionId)(map(vote => vote.electionId)(currentUserVotes))),
      every(electionData => toLower(electionData.status) === 'open')
    )(bucket);

    return div({style: styles.voteInfo}, [
      h(Alert, {
        title: 'Voting is disabled since not all elections are open.',
        type: 'danger',
        isRendered: !adminPage && !allOpenElections
      }),
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: currentUserVotes,
        isFinal: isChair,
        isDisabled: adminPage || readOnly || isEmpty(currentUserVotes) || !allOpenElections,
        isApprovalDisabled,
        isLoading,
        adminPage
      }),
      ChairVoteInfo({dacVotes, isChair, isLoading, algorithmResult, adminPage})
    ]);
  };

  const DatasetsRequested = () => {
    return h(DatasetsRequestedPanel, {
      dacDatasetIds,
      bucketDatasetIds,
      collectionDatasets,
      isLoading,
      adminPage
    });
  };

  return div({ style: styles.baseStyle, datacy: 'dataset-vote-slab' }, [
    div({ style: styles.slabTitle }, [title]),
    div({ isRendered: !isLoading }, [
      DataUseSummary(),
      VoteInfoSubsection(),
      DatasetsRequested(),
    ]),
    div({
      isRendered: isLoading,
      className: 'text-placeholder',
      style: { height: '100px' },
    })
  ]);
}