import MultiDatasetVoteSlab from "../../components/collection_voting_slab/MultiDatasetVoteSlab";
import {div, h} from "react-hyperscript-helpers";
import ResearchProposalVoteSlab from "../../components/collection_voting_slab/ResearchProposalVoteSlab";
import {useEffect, useState} from "react";
import {find, get, filter, flow, sortBy, map, isNil, isEmpty} from 'lodash/fp';
import {Storage} from "../../libs/storage";
import {User} from "../../libs/ajax";
import {extractUserDataAccessVotesFromBucket} from "../../utils/DarCollectionUtils";

const styles = {
  baseStyle: {
    backgroundColor: '#FFFFFF',
    padding: '35px',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '35px'
  },
  title: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '2.4rem',
    fontWeight: 'bold'
  }
};

const containsVotesByUser = (bucket) => {
  const user = Storage.getCurrentUser();
  return !isEmpty(extractUserDataAccessVotesFromBucket(bucket, user));
};

export default function MultiDatasetVotingTab(props) {
  const [rpBucket, setRpBucket] = useState({});
  const [dataBuckets, setDataBuckets] = useState([]);
  const [collectionDatasets, setCollectionDatasets] = useState([]);
  const [dacDatasetIds, setDacDatasetIds] = useState([]);
  const {darInfo, buckets, collection, isChair, isLoading} = props;

  useEffect( () => {
    setCollectionDatasets(get('datasets')(collection));
    setRpBucket(find(bucket => get('key')(bucket) === 'RP Vote')(buckets));
    setDataBuckets(flow(
      filter(bucket => get('key')(bucket) !== 'RP Vote'),
      filter(bucket => containsVotesByUser(bucket)),
      sortBy(bucket => get('key')(bucket))
    )(buckets));
  }, [buckets, collection]);

  useEffect(() => {
    const init = async () => {
      const dacDatasets = await User.getUserRelevantDatasets();
      const datasetIds = flow(
        map(dataset => get('dataSetId')(dataset)),
        filter(datasetId => !isNil(datasetId))
      )(dacDatasets);
      setDacDatasetIds(datasetIds);
    };
    init();
  }, []);

  const isApprovalDisabled = () => {
    const researcherLibraryCards = flow(
      get('createUser'),
      get('libraryCards')
    )(collection);
    const researcherMissingLibraryCards = isNil(researcherLibraryCards) || isEmpty(researcherLibraryCards);
    return isChair && researcherMissingLibraryCards;
  };

  const DatasetVoteSlabs = () => {
    let index = 0;
    return map(bucket => {
      index++;
      return h(MultiDatasetVoteSlab,{
        title: `GROUP ${index}`,
        bucket,
        dacDatasetIds,
        collectionDatasets,
        isChair,
        key: bucket.key
      });
    })(dataBuckets);
  };

  return div({style: styles.baseStyle}, [
    div({style: styles.title}, ["Research Proposal"]),
    h(ResearchProposalVoteSlab, {
      darInfo,
      bucket: rpBucket,
      isChair,
      isLoading
    }),
    DatasetVoteSlabs()
  ]);
}