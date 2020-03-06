import React from 'react';
import { div, textarea, fieldset, h, input, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';

const HEADER = {
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  textTransform: 'none',
  margin: '16px 0px',
}

const FADED = {
  opacity: '70%',
  margin: '8px 0px',
}

const INPUT = {
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: '400',
  border: 'none',
  padding: '8px',
  width: '100%',
  resize: 'none',
}

export const VoteQuestion = hh(class VoteQuestion extends React.PureComponent {

  setVote = (voteStatus, rationale) => {
    const { vote, updateVote } = this.props;
    if (rationale === "") {
      rationale = null;
    };
    updateVote(vote.voteId, voteStatus, rationale);
  };

  render() {
    const { label, question, vote, id } = this.props;
    return div({ style: { marginBottom: '24px' } },
      [
        div({ style: FADED }, label),
        div({ style: HEADER }, question),
        div({ style: FADED }, "Your vote*"),
        fieldset([
          input({
            type: 'radio',
            id: id + '-yes',
            onChange: () => this.setVote(true),
            checked: vote === null ? false : vote.vote === true, // field will be checked if vote was previously submitted
          }),
          h('label', {
            htmlFor: id + '-yes',
            style: { margin: '8px' },
          }, "Yes"),
          input({
            type: 'radio',
            id: id + '-no',
            onChange: () => this.setVote(false),
            checked: vote === null ? false : vote.vote === false,
          }),
          h('label', {
            htmlFor: id + '-no',
            style: { margin: '8px' },
          }, "No")
        ]),
        div({ style: FADED }, "Rationale"),
        textarea({
          style: INPUT,
          rows: '5',
          placeholder: "OPTIONAL: Describe your rationale or add comments here",
          onChange: e => this.setVote(null, e.target.value),
          value: vote === null ? null : vote.rationale, // rationale will be displayed if vote was previously submitted
        })
      ]);
  }
});
