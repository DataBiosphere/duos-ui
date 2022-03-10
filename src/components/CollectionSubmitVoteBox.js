import {div, span} from "react-hyperscript-helpers";

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
          div(["Buttons"])
        ]),
        div([
          span(["Rationale (optional):"]),
          div(["Rationale Box"])
        ])
      ])
    ])
  );
}