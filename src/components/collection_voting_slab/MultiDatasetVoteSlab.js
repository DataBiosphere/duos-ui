import {div, h} from "react-hyperscript-helpers";
import CollectionSubmitVoteBox from "../collection_vote_box/CollectionSubmitVoteBox";
import VotesPieChart from "../common/VotesPieChart";
import VoteSummaryTable from "../vote_summary_table/VoteSummaryTable";
import {filter, find, flatMap, flow, map, isNil, isEmpty, get, includes, forEach} from "lodash/fp";
import {Storage} from "../../libs/storage";
import {useEffect, useState} from "react";
import {translateDataUseRestrictionsFromDataUseArray} from "../../libs/dataUseTranslation";
import {generatePreProcessedBucketData} from "../../utils/DarCollectionUtils";
import DatasetsRequestedPanel from "./DatasetsRequestedPanel";
import {flatMapDeep} from "lodash";
import {DataSet, User} from "../../libs/ajax";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    padding: '15px 25px',
    margin: '10px 0 20px 0'
  },
  slabTitle: {
    color: '#000000',
    backgroundColor: '#F1EDE8',
    fontSize: '1.6rem',
    fontWeight: 'bold',
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
  }
};


export default function MultiDatasetVoteSlab(props) {
  const [currentUserVotes, setCurrentUserVotes] = useState([]);
  const [dacVotes, setDacVotes] = useState([]);
  const [bucketDatasetIds, setBucketDatasetIds] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const {title, bucket, collection, dacDatasetIds, isChair, isLoading} = props;
  //const abc = consentTranslations.translateDataUseRestrictionsFromDataUseArray();

  useEffect(() => {
    const user = Storage.getCurrentUser();
    const votes = !isNil(bucket) ? bucket.votes : [];

    const memberVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      flatMap(filteredData => filteredData.memberVotes)
    )(votes);

    const userVotes = flow(
      filter(vote => vote.dacUserId === user.dacUserId),
      filter(vote => !isNil(vote.electionId))
    )(memberVotes);

    setCurrentUserVotes(userVotes);
  }, [bucket]);

  useEffect(() => {
    const init = async () => {
      const bucketElections = get('elections', bucket);

      const bucketDatasetIds = [];
      forEach(election =>
        forEach(e => {
          const id = get('dataSetId')(e);
          bucketDatasetIds.push(id);
        })(election)
      )(bucketElections);

      setBucketDatasetIds(bucketDatasetIds);

      const currentUserDatasets = filter(dataset =>
        includes(dataset.dataSetId, bucketDatasetIds)
      )(await User.getDatasetsForMe());

      const dataUseTranslations = await translateDataUseRestrictionsFromDataUseArray(
        map(dataset => dataset.dataUse)(currentUserDatasets)
      );

      console.log(dataUseTranslations);
    };
    init();
  }, [bucket]);

  const VoteInfoSubsection = () => {

    return div({style: styles.voteInfo}, [
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: currentUserVotes, //needs votes from this user for this bucket across all data access elections
        isFinal: isChair,
        isLoading
      }),
      h(VotesPieChart, {
        votes: dacVotes,
        isRendered: isChair && dacVotes.length > 0
      }),
      h(VoteSummaryTable, {
        dacVotes,//needs votes for this bucket from this DAC (maybe a single election to avoid repeats)
        isLoading,
        isRendered: isChair && dacVotes.length > 0
      })
    ]);
  };

  const DatasetsRequested = () => {
    return h(DatasetsRequestedPanel, {
      dacDatasetIds,
      bucketDatasetIds,
      collectionDatasets: get('datasets')(collection),
      isLoading
    });
  };


  return div({style: styles.baseStyle}, [
    div({style: styles.slabTitle}, [title]),
    div({style: styles.dataUses}, ['Data Use Translations']),
    VoteInfoSubsection(),
    DatasetsRequested()
  ]);
}