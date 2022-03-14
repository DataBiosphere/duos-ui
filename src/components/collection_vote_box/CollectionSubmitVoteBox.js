import {div, h, span, textarea} from "react-hyperscript-helpers";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";
import {isEmpty} from "lodash/fp";
import CollectionVoteYesButton from "./CollectionVoteYesButton";
import CollectionVoteNoButton from "./CollectionVoteNoButton";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#333F52',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '2rem'
  },
  question: {
    fontSize: '1.8rem',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  subsection: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '1.5rem'
  },
  voteButtonsSection: {
    display: 'flex',
    columnGap: '1rem'
  },
  rationaleTextArea: {
    borderRadius: '4px',
    fontWeight: '500',
    color: '#181818A6',
    width: '40rem',
  }
};


export default function CollectionSubmitVoteBox(props) {
  const [vote, setVote] = useState();
  const [rationale, setRationale] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const {question, votes, isFinal} = props;

  useEffect(() => {
    if (!isEmpty(votes)) {
      const prevVote = votes[0];

      if (!isNil(prevVote.vote)) {
        setVote(prevVote.vote);
        setSubmitted(true);
      }
      if (!isNil(prevVote.rationale)) {
        setRationale(prevVote.rationale);
      }
    }
  }, []);


  const updateVote = (newVote) => {
    const voteIds = ld.map(votes, v => v.voteId);
    console.log("vote submitted: " + newVote);
    console.log(voteIds);
    setVote(newVote);
    setSubmitted(true);
    // Votes.updateVotesByIds(voteIds, {vote});
  };

  const updateRationale = () => {
    const voteIds = ld.map(votes, v => v.voteId);
    console.log("Rationale updated to " + rationale);
    // Votes.updateVotesByIds(voteIds, {vote, rationale});
  };

  const VoteSubsectionHeading = () => {
    const heading = isFinal?
      "Your Vote* (Vote and Rationale cannot be updated after submitting)" :
      "Your Vote*";
    return span([heading]);
  };

  return (
    div({style: styles.baseStyle}, [
      div({style: styles.question}, [question]),
      div({style: styles.content}, [
        div({style: styles.subsection}, [
          h(VoteSubsectionHeading),
          div({style: styles.voteButtonsSection}, [
            h(CollectionVoteYesButton, {
              onClick: () => updateVote(true),
              disabled: isFinal && submitted,
              isSelected: vote === true
            }),
            h(CollectionVoteNoButton, {
              onClick: () => updateVote(false),
              disabled: isFinal && submitted,
              isSelected: vote === false,
            })
          ])
        ]),
        div({style: styles.subsection}, [
          span(["Rationale (optional):"]),
          textarea({
            name: 'Rationale Input',
            value: rationale,
            placeholder: "Optional: Describe your rationale or add comments here",
            onChange: e => setRationale(e.target.value),
            onBlur: updateRationale,
            style: styles.rationaleTextArea,
            rows: 4,
            disabled: isFinal && submitted
          }),
        ])
      ])
    ])
  );
}