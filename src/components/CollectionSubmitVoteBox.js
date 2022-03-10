import {div, h, span, textarea} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";
import {CancelOutlined, CheckCircleOutlined} from "@material-ui/icons";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#333F52',
    display: 'flex',
    flexDirection: 'column'
  },
  question: {
    fontSize: '1.8rem',
  },
  content: {
    display: 'flex'
  },
  rationaleSubsection: {
    display: 'flex',
    flexDirection: 'column',
    width: '40rem'
  },
  rationaleTextArea: {
    borderRadius: '4px',
    fontWeight: '500',
    color: '181818A6'
  }
};


export default function CollectionSubmitVoteBox(props) {
  const [vote, setVote] = useState();
  const [rationale, setRationale] = useState('');
  const {question, votes} = props;

  const updateRationale = () => {
    console.log("Submit!");
  };

  useEffect(() => {
    const prevVote = votes[0].vote;
    if (!isNil(prevVote)) {
      setVote(prevVote);
    }

    const prevRationale = votes[0].rationale;
    if (!isNil(prevRationale)) {
      setRationale(prevRationale);
    }
  }, []);

  const updateVote = (vote) => {
    const voteIds = ld.map(votes, v => v.voteId);
    console.log("vote submitted: " + vote);
    console.log(voteIds);
   // Votes.updateVotesByIds(voteIds, {vote});
  };

  return (
    div({style: styles.baseStyle}, [
      div({style: styles.question}, [question]),
      div({style: styles.content}, [
        div([
          span(["Your Vote*"]),
          div({style: styles.content}, [
            h(SimpleButton, {
              label: span([h(CheckCircleOutlined), "Yes"]),
              onClick: () => updateVote(true),
              baseColor: '#1FA371'
            }),
            h(SimpleButton, {
              label: span([h(CancelOutlined), "No"]),
              onClick: () => updateVote(false),
              baseColor: '#DA0003'
            }),
          ])
        ]),
        div({style: styles.rationaleSubsection}, [
          span(["Rationale (optional):"]),
          textarea({
            name: 'Rationale Input',
            value: rationale,
            placeholder: "Optional: Describe your rationale or add comments here",
            onChange: e => setRationale(e.target.value),
            onBlur: updateRationale,
            rows: 4,
            style: styles.rationaleTextArea,
          }),
        ])
      ])
    ])
  );
}