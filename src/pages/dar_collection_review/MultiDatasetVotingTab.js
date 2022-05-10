import MultiDatasetVoteSlab from "../../components/collection_voting_slab/MultiDatasetVoteSlab";
import {div, h} from "react-hyperscript-helpers";
import ResearchProposalVoteSlab from "../../components/collection_voting_slab/ResearchProposalVoteSlab";
import {useEffect, useState} from "react";
import {find, get, filter, flow, sortBy, map, isNil, isEmpty} from 'lodash/fp';
import {Storage} from "../../libs/storage";
import {User} from "../../libs/ajax";
import {extractUserDataAccessVotesFromBucket} from "../../utils/DarCollectionUtils";
import {Alert} from "../../components/Alert";

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
    fontSize: '2.4rem',
    fontWeight: 'bold',
    marginBottom: '10px'
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
  const missingLibraryCardMessage = "The Researcher must have a Library Card before data access can be granted.\n" +
    "You can still deny this request and/or vote on the Structured Research Purpose.";

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

  const DatasetVoteSlabs = () => {
    const isApprovalDisabled = dataAccessApprovalDisabled();
    let index = 0;
    return map(bucket => {
      index++;
      return h(MultiDatasetVoteSlab,{
        title: `GROUP ${index}`,
        bucket,
        dacDatasetIds,
        collectionDatasets,
        isChair,
        isApprovalDisabled,
        key: bucket.key,
      });
    })(dataBuckets);
  };

  const dataAccessApprovalDisabled = () => {
    const researcherLibraryCards = flow(
      get('createUser'),
      get('libraryCards')
    )(collection);
    const researcherMissingLibraryCards = isNil(researcherLibraryCards) || isEmpty(researcherLibraryCards);
    return isChair && researcherMissingLibraryCards;
  };

  return div({style: styles.baseStyle}, [
    div({style: styles.title}, ["Research Proposal"]),
    Alert({
      type: 'danger',
      title: missingLibraryCardMessage,
      id: 'missing_lc',
      isRendered: dataAccessApprovalDisabled()
    }),
    div({style: styles.slabs}, [
      h(ResearchProposalVoteSlab, {
        darInfo,
        bucket: rpBucket,
        isChair,
        isLoading
      }),
      DatasetVoteSlabs()
    ])
  ]);
}
