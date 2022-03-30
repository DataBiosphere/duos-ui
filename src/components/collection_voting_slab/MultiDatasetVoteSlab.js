import {div, h} from "react-hyperscript-helpers";
import CollectionSubmitVoteBox from "../collection_vote_box/CollectionSubmitVoteBox";
import VotesPieChart from "../common/VotesPieChart";
import VoteSummaryTable from "../vote_summary_table/VoteSummaryTable";
import {filter, find, flatMap, flow, map, isNil, isEmpty, get} from "lodash/fp";
import {Storage} from "../../libs/storage";
import {useEffect, useState} from "react";
import {translateDataUseRestrictionsFromDataUseArray} from "../../libs/dataUseTranslation";
import {generatePreProcessedBucketData} from "../../utils/DarCollectionUtils";
import DatasetsRequestedPanel from "./DatasetsRequestedPanel";
import {flatMapDeep} from "lodash";

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
  const {title, bucket, collection, dacDatasetIds, isChair, isLoading} = props;
  //const abc = consentTranslations.translateDataUseRestrictionsFromDataUseArray();

  useEffect(()  => {
    const user = Storage.getCurrentUser();
    const votes = !isNil(bucket) ? bucket.votes : [];

    const memberVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      flatMap(filteredData => filteredData.memberVotes)
    )(votes);

    const targetUserElectionIds = flow(
      filter(vote => vote.dacUserId === user.dacUserId),
      map(vote => vote.electionId)
    )(memberVotes);

    const targetUserVotes = filter((vote) => {
      const relevantVote = find((id) => vote.electionId === id)(targetUserElectionIds);
      return !isNil(relevantVote);
    })(memberVotes);

    setCurrentUserVotes(targetUserVotes);
  }, [bucket]);

  useEffect( () => {
    const init = async () => {
      const {dars, datasets} = collection;
      const buckets = await generatePreProcessedBucketData({dars, datasets});
      console.log(buckets);
    };
    init();
  });

  const VoteInfoSubsection = () => {

    return div({style: styles.voteInfo}, [
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: currentUserVotes,
        isFinal: isChair,
        isLoading
      }),
      h(VotesPieChart, {
        votes: dacVotes,
        isRendered: isChair && dacVotes.length > 0
      }),
      h(VoteSummaryTable, {
        dacVotes,
        isLoading,
        isRendered: isChair && dacVotes.length > 0
      })
    ]);
  };

  const DatasetsRequested = () => {

    const bucketDatasetIds = flow(
      get('elections'),
      flatMapDeep(() => {
        flatMapDeep(() => get('dataSetId'));
      })
    )(bucket);

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