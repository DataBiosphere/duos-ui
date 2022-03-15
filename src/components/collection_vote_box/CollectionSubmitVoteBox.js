import {div, h, span, textarea} from "react-hyperscript-helpers";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";
import {isEmpty} from "lodash/fp";
import CollectionVoteYesButton from "./CollectionVoteYesButton";
import CollectionVoteNoButton from "./CollectionVoteNoButton";
import {Notifications} from "../../libs/utils";
import {Votes} from "../../libs/ajax";

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

      const voteValues = ld.map(votes, vote => vote.vote);
      if (allMatch(voteValues)) {
        setVote(prevVote.vote);
        setSubmitted(true);
      }

      const rationaleValues = ld.map(votes, vote => vote.rationale);
      if (allMatch(rationaleValues)) {
        setRationale(prevVote.rationale);
      }
    }
  }, [votes]);

  const allMatch = (values)  => {
    return ld.every(values, v => {
      return !isNil(v) && v === values[0];
    });
  };

  const updateVote = async (newVote) => {
    try {
      const voteIds = ld.map(votes, v => v.voteId);
    //  await Votes.updateVotesByIds(voteIds, {vote: newVote, rationale});
      setVote(newVote);
      setSubmitted(true);
      Notifications.showSuccess({text: `Successfully updated votes`});
    } catch (error) {
      Notifications.showError({text: 'Error: Failed to update votes'});
    }
  };

  const VoteSubsectionHeading = () => {
    const heading = isFinal?
      "Your Vote* (Vote and Rationale cannot be updated after submitting)" :
      "Your Vote*";
    return span([heading]);
  };

  return (
    div({style: styles.baseStyle, dataCy: 'collection-vote-box'}, [
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
            onBlur: () => updateVote(vote),
            style: styles.rationaleTextArea,
            rows: 4,
            disabled: isFinal && submitted
          }),
        ])
      ])
    ])
  );
}