import {div, h} from "react-hyperscript-helpers";
import CollectionSubmitVoteBox from "../collection_vote_box/CollectionSubmitVoteBox";
import VotesPieChart from "../common/VotesPieChart";
import VoteSummaryTable from "../vote_summary_table/VoteSummaryTable";
import {filter, flatMap, flow, map, isNil, isEmpty, get, includes, find, every, forEach, groupBy, cloneDeep} from "lodash/fp";
import {Storage} from "../../libs/storage";
import {useEffect, useState} from "react";
import DatasetsRequestedPanel from "./DatasetsRequestedPanel";
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

    //NOTE: display all for pie chart, collapse if possible for table
    const dacVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      map(filteredData => filteredData.memberVotes),
      filter(memberVotes => includes(user.dacUserId, map(memberVote => memberVote.dacUserId)(memberVotes))),
      flatMap(memberVotes => memberVotes)
    )(votes);
    setDacVotes(dacVotes);

    //User votes used in voteBox
    const userVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      flatMap(filteredData => filteredData.memberVotes),
      filter(memberVote => memberVote.dacUserId === user.dacUserId)
    )(votes);
    setCurrentUserVotes(userVotes);

    //TODO: make sure election has a vote that has this users' userId in it  X
    //note: may need to find id in dar
    const datasetIds = flow(
      get('elections'),
      flatMap(election => flatMap(electionData => electionData)(election)),
      filter(electionData => electionData.electionType === 'DataAccess'),
      filter(electionData => includes(electionData.electionId)(map(vote => vote.electionId)(userVotes))),
      map(electionData => electionData.dataSetId)
    )(bucket);
    setBucketDatasetIds(datasetIds);
  }, [bucket]);

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
      every(electionData => electionData.status === 'Open')
    )(bucket);

    return div({style: styles.voteInfo}, [
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: currentUserVotes,
        isFinal: isChair,
        isDisabled: isEmpty(currentUserVotes) || !allOpenElections,
        isLoading
      }),
      ChairVoteInfo()
    ]);
  };

  const ChairVoteInfo = () => {
    const votesGroupedByUser = groupBy(vote => vote.dacUserId)(cloneDeep(dacVotes));

    const votesCollapsedByUser = flatMap(userIdKey => {
      const votesByUser = votesGroupedByUser[userIdKey];
      const collapsedVotes = collapseVotes({votes: votesByUser});

      return map( key => {
        const collapsedVote = collapsedVotes[key];
        let collapsedRationale = "";
        let collapsedDate = "";

        forEach( r =>
          collapsedRationale += `${r}\n`
        )(collapsedVote.rationales);

        forEach(d =>
          collapsedDate += `${d}\n`
        )(collapsedVote.createDates);

        return {
          vote: collapsedVote.vote ,
          displayName: collapsedVote.displayName,
          rationale: !isEmpty(collapsedRationale) ? collapsedRationale : null,
          createDate: !isEmpty(collapsedDate) ? collapsedDate : null
        };
      })(Object.keys(collapsedVotes));

    })(Object.keys(votesGroupedByUser));



    console.log(votesCollapsedByUser);


    return div({style: styles.chairVoteInfo, isRendered: isChair && dacVotes.length > 0}, [
      h(VotesPieChart, {
        votes: dacVotes,
      }),
      div(['My DAC\'s Votes (detail)']),
      h(VoteSummaryTable, {
        dacVotes: votesCollapsedByUser,
        isLoading,
      })
    ]);
  };

  const collapseVotes = ({votes}) => {
    const collapsedVotes = {};
    forEach( vote => {
      const matchingVote = collapsedVotes[`${vote.vote}`];

      if (isNil(matchingVote)) {
        collapsedVotes[`${vote.vote}`] = {
          vote: vote.vote,
          displayName: vote.displayName,
          rationales: !isNil(vote.rationale) ? [vote.rationale] : [],
          createDates: !isNil(vote.createDate) ? [vote.createDate] : []
        };
      }
      else {
        if(!isNil(vote.rationale) && !includes(vote.rationale, matchingVote.rationales)) {
          matchingVote.rationales.push(vote.rationale);
        }
        if(!isNil(vote.createDate) && !includes(vote.createDate, matchingVote.createDates)) {
          matchingVote.createDates.push(vote.createDate);
        }
      }
    })(votes);
    return collapsedVotes;
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