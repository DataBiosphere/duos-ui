import {div, h} from "react-hyperscript-helpers";
import CollectionSubmitVoteBox from "../collection_vote_box/CollectionSubmitVoteBox";
import VotesPieChart from "../common/VotesPieChart";
import VoteSummaryTable from "../vote_summary_table/VoteSummaryTable";
import {filter, flatMap, flow, map, isNil, isEmpty, get, includes, forEach, find} from "lodash/fp";
import {Storage} from "../../libs/storage";
import {useEffect, useState} from "react";
import DatasetsRequestedPanel from "./DatasetsRequestedPanel";
import ld from "lodash";
import DataUsePill from "./DataUsePill";
import {dataUsePills} from "./ResearchProposalVoteSlab";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    padding: '15px 25px',
    margin: '10px 0 20px 0'
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
  const {title, bucket, collectionDatasets, dacDatasetIds, isChair, isLoading} = props;


  useEffect(() => {
    const user = Storage.getCurrentUser();
    const votes = !isNil(bucket) ? bucket.votes : [];

//VOTES FOR DAC OF CURRENT USER
    //TODO: filter for all elections, collapse if same vote value (if different dates or rationale, concatenate), else
    //display all
    const dacVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      map(filteredData => filteredData.memberVotes),
      find(memberVotes => includes(user.dacUserId, map(memberVote => memberVote.dacUserId)(memberVotes)))
    )(votes);
    setDacVotes(dacVotes);

    //votes in this bucket by this user across all data access elections -- used for vote box
    //TODO: check if all votes are for open elections, else disable vote box
    const userVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      flatMap(filteredData => filteredData.memberVotes),
      filter(memberVote => memberVote.dacUserId === user.dacUserId)
    )(votes);
    setCurrentUserVotes(userVotes);

    //TODO: make sure election has a vote that has this users' userId in it
    const bucketElections = get('elections', bucket);
    const datasetIds = [];
    forEach(election =>
      forEach(electionData => {
        const id = get('dataSetId')(electionData);
        datasetIds.push(id);
      })(election)
    )(bucketElections);
    setBucketDatasetIds(datasetIds);
  }, [bucket]);

  const DataUseSummary = () => {
    const dataUses = get('dataUses')(bucket);
    return !isNil(dataUses)
      ? div({style: styles.dataUses}, [dataUsePills(dataUses)])
      : div();
  };

  const VoteInfoSubsection = () => {
    return div({style: styles.voteInfo}, [
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: currentUserVotes,
        isFinal: isChair,
        isDisabled: isEmpty(currentUserVotes),
        isLoading
      }),
      ChairVoteInfo()
    ]);
  };

  const ChairVoteInfo = () => {
    return div({style: styles.chairVoteInfo, isRendered: isChair && dacVotes.length > 0}, [
      h(VotesPieChart, {
        votes: dacVotes,
      }),
      div(['My DAC\'s Votes (detail)']),
      h(VoteSummaryTable, {
        dacVotes,
        isLoading,
      })
    ]);
  };

  const DatasetsRequested = () => {
    return h(DatasetsRequestedPanel, {
      dacDatasetIds,
      bucketDatasetIds,
      collectionDatasets,
      isLoading
    });
  };

  return div({style: styles.baseStyle}, [
    div({style: styles.slabTitle}, [title]),
    DataUseSummary(),
    VoteInfoSubsection(),
    DatasetsRequested()
  ]);
}