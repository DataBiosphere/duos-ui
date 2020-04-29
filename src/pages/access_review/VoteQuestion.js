import React from 'react';
import { div, textarea, fieldset, h, input, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import * as fp from 'lodash/fp';

const HEADER = {
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
  textTransform: 'none',
  margin: '16px 0px',
};

const FADED = {
  opacity: '70%',
  margin: '8px 0px',
};

const INPUT = {
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: Theme.font.weight.regular,
  border: 'none',
  padding: '8px',
  width: '100%',
  resize: 'none',
};

export const VoteQuestion = hh(class VoteQuestion extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      voteStatus: null,
      rationale: ''
    };
  }

  setVote = (voteStatus, rationale) => {
    const { updateVote, voteId } = this.props;
    if (fp.isNil(rationale)) {
      rationale = null;
    }
    this.setState({
      voteStatus: voteStatus,
      rationale: rationale
    });
    updateVote(voteId, voteStatus, rationale);
  };

  render() {
    const { label, question, id, rationale, selectedOption } = this.props;

    return div({ style: { marginBottom: '24px' } },
      [
        div({ style: FADED }, label),
        div({ style: HEADER }, question),
        div({ style: FADED }, 'Your vote*'),
        fieldset([
          input({
            type: 'radio',
            id: id + '-yes',
            onChange: () => this.setVote(true, this.state.rationale),
            checked: selectedOption === null ? false : selectedOption === true, // field will be checked if vote was previously submitted
          }),
          h('label', {
            htmlFor: id + '-yes',
            style: { margin: '8px' },
          }, 'Yes'),
          input({
            type: 'radio',
            id: id + '-no',
            onChange: () => this.setVote(false, this.state.rationale),
            checked: selectedOption === null ? false : selectedOption === false,
          }),
          h('label', {
            htmlFor: id + '-no',
            style: { margin: '8px' },
          }, 'No')
        ]),
        div({ style: FADED }, 'Rationale'),
        textarea({
          style: INPUT,
          rows: '5',
          placeholder: 'OPTIONAL: Describe your rationale or add comments here',
          onChange: e => this.setVote(this.state.voteStatus, e.target.value),
          value: rationale
        })
      ]);
  }
});
