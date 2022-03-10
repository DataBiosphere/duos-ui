import {div, span} from "react-hyperscript-helpers";

export default function CollectionSubmitVoteBox(props) {
  return (
    div([
      div(["QUESTION"]),
      div({dataCy: 'content'}[
        div({dataCy: 'vote-container'},[
          span(["Vote Title"]),
          div(["Buttons"])
        ]),
        div({dataCy: 'rationale-container'},[
          span(["Rationale Title"]),
          div(["Rationale Box"])
        ])
      ])
    ])
  );
}