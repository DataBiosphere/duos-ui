import React from 'react';
import { div, a, hh } from "react-hyperscript-helpers";
import { Theme } from '../theme';
import { VoteQuestion } from './VoteQuestion';

export const VoteAsChair = hh(class VoteAsChair extends React.PureComponent {
  render() {
    return div({ id: 'chair-vote' }, [
      VoteQuestion({
        id: 'final-question',
        label: 'Final Question:',
        question: 'Does the DAC grant this researcher permission to access the data?'
      })
    ]);
  }
});
