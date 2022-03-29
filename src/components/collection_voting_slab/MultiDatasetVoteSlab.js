import {div, h} from "react-hyperscript-helpers";
import CollectionSubmitVoteBox from "../collection_vote_box/CollectionSubmitVoteBox";

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
    width: 'fit-content',
    padding: '1.2rem',
    borderRadius: '4px 4px 0 0',
  },
};


export default function MultiDatasetVoteSlab(props) {
  const { title, bucket, isChair, isLoading } = props;
  //const abc = consentTranslations.translateDataUseRestrictionsFromDataUseArray();

  const VoteInfoSubsection = () => {
    return div({}, [
      h(CollectionSubmitVoteBox, {
        question: 'Should data access be granted to this applicant?',
        votes: null,
        isFinal: isChair,
        isLoading
      }),
      div(["Vote Chart"]),
      div(["My DAC's Vote Table"])
    ]);
  };

  return div({style: styles.baseStyle}, [
    div({style: styles.slabTitle}, [title]),
    div({}, ['Data Use Translations']),
    h(VoteInfoSubsection, {}),
    div({}, ['Datasets Required'])
  ]);
}