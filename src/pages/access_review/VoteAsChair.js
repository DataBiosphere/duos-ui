import React from 'react';
import { div, a, span, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { VoteQuestion } from './VoteQuestion';
import * as fp from 'lodash/fp';
import * as moment from 'moment';

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
  constructor(props) {
    super(props);
    this.state = {
      viewMatchResults: true
    };
  }
  componentDidMount() {
    this.props.getVotes();
    this.props.getMatchData();
  };

  toggleMatchData = () => {
    this.setState(prev => {
      prev.viewMatchResults = !prev.viewMatchResults;
      return prev;
    });
  };

  formatMatchData = (matchData) => {
    const failure = JSON.stringify(fp.getOr('false')('failed')(matchData)).toLowerCase() === 'true';
    const vote = JSON.stringify(fp.getOr('false')('match')(matchData)).toLowerCase() === 'true';
    const voteString = failure ? 'Unable to determine a system match' : vote ? 'Yes' : 'No';
    const style = { marginLeft: '2rem', fontWeight: 'normal', textTransform: 'none' };
    return div({}, [
      div({},['Vote:', span({style: style}, [voteString])]),
      div({},['Date:', span({style: style}, [moment(fp.get('createDate')(matchData)).format('YYYY-MM-DD')])]),
    ]);
  };

  render() {
    const { finalVote, onUpdate, matchData } = this.props;
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
        a({ style: LINK, onClick: this.toggleMatchData }, [
          'View DUOS algorithm decision',
          span({ className: 'glyphicon glyphicon-menu-down', style: { marginLeft: '6px' } })
        ])
      ]),
      div({style: {display: this.state.viewMatchResults ? 'block' : 'none'}}, [
        this.formatMatchData(matchData)
      ])
    ]);
  }
});
