import {div, h, span, textarea} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";
import {useEffect, useState} from "react";
import {isNil} from "lodash";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    color: '#333F52',
    display: 'flex',
    flexDirection: 'column'
  },
  question: {
    fontSize: '1.8rem',
    fontWeight: 'bold'
  },
  content: {
    display: 'flex'
  }
};


export default function CollectionSubmitVoteBox(props) {
  const [rationale, setRationale] = useState('');
  const {question, votes} = props;

  const updateRationale = () => {
    console.log("Sumbit!");
  };

  useEffect(() => {
    const prevRationale = votes[0].rationale;
    if (!isNil(prevRationale)) {
      setRationale(prevRationale);
    }
  }, []);

  const updateVote = (vote) => {
    console.log("vote submitted: " + vote);
  };

  return (
    div({style: styles.baseStyle}, [
      div({style: styles.question}, [question]),
      div({style: styles.content}, [
        div([
          span(["Your Vote*"]),
          div({style: styles.content}, [
            h(SimpleButton, {label: "Yes", onClick: () => updateVote(true)}),
            h(SimpleButton, {label: "No", onClick: () => updateVote(false)})
          ])
        ]),
        div({style: { display: 'flex', flexDirection: 'column', width: '40rem'}}, [
          span(["Rationale (optional):"]),
          textarea({
            name: 'Rationale Input',
            value: rationale,
            placeholder: "Optional: Describe your rationale or add comments here",
            onChange: e => setRationale(e.target.value),
            onBlur: updateRationale,
            rows: 4,
            style: {borderRadius: '4px'},
          }),
        ])
      ])
    ])
  );
}