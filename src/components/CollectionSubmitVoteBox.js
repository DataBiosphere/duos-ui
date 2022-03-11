import {button, div, h, span, textarea} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";
import {CancelOutlined, CheckCircleOutlined} from "@material-ui/icons";
import VoteResultIcon from "./common/DataUseVoteSummary/VoteResultIcon";
import {Votes} from "../libs/ajax";
import {isEmpty} from "lodash/fp";

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
  buttonAdditionalStyle: {
    height: '45px',
    width: '94px'
  },
  rationaleTextArea: {
    borderRadius: '4px',
    fontWeight: '500',
    color: '181818A6',
    width: '40rem',
  }
};


export default function CollectionSubmitVoteBox(props) {
  const [vote, setVote] = useState();
  const [rationale, setRationale] = useState('');
  const {question, votes, isFinal} = props;

  useEffect(() => {
    if (!isEmpty(votes)) {
      const prevVote = votes[0];

      if (!isNil(prevVote.vote)) {
        setVote(prevVote.vote);
      }
      if (!isNil(prevVote.rationale)) {
        setRationale(prevVote.rationale);
      }
    }
  }, []);

  const updateVote = (vote) => {
    const voteIds = ld.map(votes, v => v.voteId);
    console.log("vote submitted: " + vote);
    console.log(voteIds);
   // Votes.updateVotesByIds(voteIds, {vote});
  };

  const updateRationale = () => {
    const voteIds = ld.map(votes, v => v.voteId);
    console.log("Rationale updated to " + rationale);
    // Votes.updateVotesByIds(voteIds, {vote, rationale});
  };


  return (
    div({style: styles.baseStyle}, [
      div({style: styles.question}, [question]),
      div({style: styles.content}, [
        div({style: styles.subsection}, [
          span(["Your Vote*"]),
          div({style: styles.voteButtonsSection}, [
            h(SimpleButton, {
              label: span([h(CheckCircleOutlined), "Yes"]),
              onClick: () => updateVote(true),
              baseColor: '#1FA371',
              additionalStyle: styles.buttonAdditionalStyle
            }),
            h(SimpleButton, {
              label: span([h(CancelOutlined), "No"]),
              onClick: () => updateVote(false),
              baseColor: '#DA0003',
              additionalStyle: styles.buttonAdditionalStyle
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
          }),
        ])
      ])
    ])
  );
}