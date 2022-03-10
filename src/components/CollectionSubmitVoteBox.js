import {div, h, span} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    display: 'flex',
    flexDirection: 'column'
  },
  content: {
    display: 'flex'
  }
};

export default function CollectionSubmitVoteBox(props) {
  const {question} = props;

  return (
    div({style: styles.baseStyle}, [
      div([question]),
      div({style: styles.content}, [
        div([
          span(["Your Vote*"]),
          div({style: styles.content}, [
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