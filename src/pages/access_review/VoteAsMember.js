import React from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { VoteQuestion } from './VoteQuestion';
import * as fp from 'lodash/fp';

export const VoteAsMember = hh(class VoteAsMember extends React.PureComponent {

  componentDidMount() {
    this.props.getVotes();
  }

  render() {
    const { onUpdate, vote, rpVote, accessElectionOpen, rpElectionOpen } = this.props;
    return div({ id: 'member-vote' }, [
      VoteQuestion({
        id: 'access-vote',
        isRendered: !fp.isNil(vote),
        label: 'Question 1:',
        question: 'Should data access be granted to this applicant?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: fp.isNil(vote) ? null : vote.voteId,
        rationale: fp.isNil(vote) ? '' : vote.rationale,
        selectedOption:fp.isNil(vote) ? null : vote.vote,
        disabled: !accessElectionOpen
      }),
      VoteQuestion({
        id: 'rp-vote',
        isRendered: !fp.isNil(rpVote),
        label: 'Question 2:',
        question: 'Was the research purpose accurately converted to a structured format?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: fp.isNil(rpVote) ? null : rpVote.voteId,
        rationale: fp.isNil(rpVote) ? '' : rpVote.rationale,
        selectedOption: fp.isNil(rpVote) ? null : rpVote.vote,
        disabled: !rpElectionOpen,
        optional: true
      }),
    ]);
  }
});
