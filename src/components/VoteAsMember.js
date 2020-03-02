import React from 'react';
import { div, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { VoteQuestion } from './VoteQuestion';

export const VoteAsMember = hh(class VoteAsMember extends React.PureComponent {
  render() {
    return div({ id: 'member-vote' }, [
      VoteQuestion({
        id: 'question-1',
        label: 'Question 1:',
        question: 'Should data access be granted to this applicant?',
      }),
      VoteQuestion({
        id: 'question-2',
        label: 'Question 2:',
        question: 'Was the research purpose accurately converted to a structured format?',
      }),
    ]);
  }
});
