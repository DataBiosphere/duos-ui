import {div, h} from "react-hyperscript-helpers";
import CollectionSubmitVoteBox from "../collection_vote_box/CollectionSubmitVoteBox";
import VotesPieChart from "../common/VotesPieChart";
import {isNil} from 'lodash';
import VoteSummaryTable from "../vote_summary_table/VoteSummaryTable";
import {filter, find, flatMap, flow, isEmpty, map} from "lodash/fp";
import {Storage} from "../../libs/storage";
import {useEffect, useState} from "react";

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
  const [dacVotes, setDacVotes] = useState([]);
  const {title, bucket, isChair, isLoading} = props;
  //const abc = consentTranslations.translateDataUseRestrictionsFromDataUseArray();

  useEffect(()  => {
    const user = Storage.getCurrentUser();
    const votes = !isNil(bucket) ? bucket.votes : [];

    const memberVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      flatMap(filteredData => filteredData.memberVotes)
    )(votes);

    const targetElectionIds = flow(
      filter(vote => vote.dacUserId === user.dacUserId),
      map(vote => vote.electionId)
    )(memberVotes);

    const targetMemberVotes = filter((vote) => {
      const relevantVote = find((id) => vote.electionId === id)(targetElectionIds);
      return !isNil(relevantVote);
    })(memberVotes);

    setDacVotes(targetMemberVotes);
  }, [bucket]);

  const VoteInfoSubsection = () => {
    return div({style: styles.voteInfo}, [
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: null,
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


  return div({style: styles.baseStyle}, [
    div({style: styles.slabTitle}, [title]),
    div({style: styles.dataUses}, ['Data Use Translations']),
    VoteInfoSubsection(),
    div({}, ['Datasets Required'])
  ]);
}