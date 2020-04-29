import React from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { VoteQuestion } from './VoteQuestion';
import * as fp from 'lodash/fp';

export const VoteAsMember = hh(class VoteAsMember extends React.PureComponent {
  componentDidMount() {
    this.props.getVotes();
  };

  render() {
    const { onUpdate, vote, rpVote } = this.props;
    return div({ id: 'member-vote' }, [
      VoteQuestion({
        id: 'access-vote',
        isRendered: vote,
        label: 'Question 1:',
        question: 'Should data access be granted to this applicant?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: fp.isNil(vote) ? null : vote.voteId,
        rationale: fp.isNil(vote) ? null : vote.rationale,
        selectedOption:fp.isNil(vote) ? null : vote.vote,
      }),
      VoteQuestion({
        id: 'rp-vote',
        isRendered: rpVote,
        label: 'Question 2:',
        question: 'Was the research purpose accurately converted to a structured format?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: fp.isNil(rpVote) ? null : rpVote.voteId,
        rationale: fp.isNil(rpVote) ? null : rpVote.rationale,
        selectedOption: fp.isNil(rpVote) ? null : rpVote.vote,
      }),
    ]);
  }
});
