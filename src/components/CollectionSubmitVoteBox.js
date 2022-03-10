import {div, h, input, span, textarea} from "react-hyperscript-helpers";
import SimpleButton from "./SimpleButton";
import isEmpty from "lodash/fp/isEmpty";

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
        div({style: styles.content}, [
          span(["Rationale (optional):"]),
          textarea({
            name: 'Rationale Input',
            placeholder: "test",
            rows: 4,
            required: false,
          }),
        ])
      ])
    ])
  );
}