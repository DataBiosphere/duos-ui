import {div, h, span} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    display: 'flex',
    flexDirection: 'column'
  }
};

export default function CollectionSubmitVoteBox(props) {
  const {question} = props;

  return (
    div({style: styles.baseStyle}, [
      div([question]),
      div([
        div([
          span(["Your Vote*"]),
          div([
            h(SimpleButton, {label: "Yes"}),
            h(SimpleButton, {label: "No"})
          ])
        ]),
        div([
          span(["Rationale (optional):"]),
          div(["Rationale Box"])
        ])
      ])
    ])
  );
}