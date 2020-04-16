import React from 'react';
import { div, a, span, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { VoteQuestion } from './VoteQuestion';

const LINK = {
  color: Theme.palette.link,
  fontWeight: Theme.font.weight.regular,
  textTransform: 'none',
  lineHeight: Theme.font.size.small,
};

const LINK_SECTION = {
  display: 'flex',
  margin: '24px 0px',
  alignItems: 'center',
};

export const VoteAsChair = hh(class VoteAsChair extends React.PureComponent {
  componentDidMount() {
    this.props.getVotes();
  };

  render() {
    const { finalVote, onUpdate } = this.props;
    return div({ id: 'chair-vote' }, [
      VoteQuestion({
        id: 'final-question',
        isRendered: finalVote,
        label: 'Final Question:',
        question: 'Does the DAC grant this researcher permission to access the data?',
        updateVote: (id, selectedOption, rationale) => onUpdate(selectedOption, rationale),
        vote: finalVote,
      }),
      div({ style: LINK_SECTION }, [
        a({ style: LINK }, [
          'View DUOS algorithm decision',
          span({ className: 'glyphicon glyphicon-menu-down', style: { marginLeft: '6px' } })
        ])
      ]),
    ]);
  }
});
