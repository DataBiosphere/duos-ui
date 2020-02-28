import React from 'react';
import { div, textarea, fieldset, h, input, a, hh } from "react-hyperscript-helpers";
import { Theme } from '../theme';

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
  render() {
    const { label, question } = this.props;
    return div({ style: { marginBottom: '24px' } },
      [
        div({ style: FADED }, label),
        div({ style: HEADER }, question),
        div({ style: FADED }, "Your vote*"),
        fieldset([
          input({
            type: 'radio',
            id: 'yes',
          }),
          h('label', { htmlFor: 'yes', style: { margin: '8px' } }, "Yes"),
          input({
            type: 'radio',
            id: 'no',
          }),
          h('label', { htmlFor: 'no', style: { margin: '8px' } }, "No")
        ]),
        div({ style: FADED }, "Rationale"),
        textarea({ style: INPUT, rows: '5', placeholder: "OPTIONAL: Describe your rationale or add comments here" })
      ]);
  }
});
