import {div, h, span, textarea} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";
import {useEffect, useState} from "react";

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
  const {question} = props;


  return (
    div({style: styles.baseStyle}, [
      div({style: styles.question}, [question]),
      div({style: styles.content}, [
        div([
          span(["Your Vote*"]),
          div({style: styles.content}, [
            h(SimpleButton, {label: "Yes"}),
            h(SimpleButton, {label: "No"})
          ])
        ]),
        div({style: { display: 'flex', flexDirection: 'column', width: '40rem'}}, [
          span(["Rationale (optional):"]),
          textarea({
            name: 'Rationale Input',
            value: rationale,
            placeholder: "Optional: Describe your rationale or add comments here",
            onChange: event => setRationale(event.target.value),
            rows: 4,
            style: {borderRadius: '4px'},
            required: false,
          }),
        ])
      ])
    ])
  );
}