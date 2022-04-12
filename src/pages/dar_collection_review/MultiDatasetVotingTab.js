import MultiDatasetVoteSlab from "../../components/collection_voting_slab/MultiDatasetVoteSlab";
import {div, h} from "react-hyperscript-helpers";
import ResearchProposalVoteSlab from "../../components/collection_voting_slab/ResearchProposalVoteSlab";
import {useEffect, useState} from "react";
import {find, get, filter, flow, sortBy, map, isNil} from 'lodash/fp';
import {Storage} from "../../libs/storage";
import {User} from "../../libs/ajax";

const styles = {
  baseStyle: {
    backgroundColor: '#FFFFFF'
  },
  title: {
    color: '#333F52',
    fontFamily: 'Montserrat',
    fontSize: '2.4rem',
    fontWeight: 'bold'
  }
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
      sortBy(bucket => get('key')(bucket))
    )(buckets));
  }, [buckets, collection]);

  useEffect(() => {
    const init = async () => {
      const dacDatasets = await User.getUserRelevantDatasets();
      const datasetIds = flow(
        map(dataset => dataset.dataSetId),
        filter(datasetId => !isNil(datasetId))
      )(dacDatasets);
      setDacDatasetIds(datasetIds);
    };

    try {
      init();
    } catch(error) {
      setDacDatasetIds([]);
    }
  }, []);


  const DatasetVoteSlabs = () => {
    return map((bucket, i) => {
      return h(MultiDatasetVoteSlab,{
        title: `GROUP ${i}`,
        bucket,
        dacDatasetIds,
        collectionDatasets,
        isChair
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