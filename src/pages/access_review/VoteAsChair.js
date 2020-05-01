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
      viewMatchResults: false
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
    // Changing state here doesn't trigger a re-render hence the need to force update.
    this.forceUpdate();
  };

  formatMatchData = (matchData) => {
    const failure = JSON.stringify(fp.getOr('false')('failed')(matchData)).toLowerCase() === 'true';
    const vote = JSON.stringify(fp.getOr('false')('match')(matchData)).toLowerCase() === 'true';
    const voteString = failure ? 'Unable to determine a system match' : vote ? 'Yes' : 'No';
    const createDateString = moment(fp.get('createDate')(matchData)).format('YYYY-MM-DD');
    const style = { marginLeft: '2rem', fontWeight: 'normal', textTransform: 'none' };
    return div({}, [
      div({},['DUOS Algorithm Decision:', span({style: style}, [voteString])]),
      div({},['Date:', span({style: style}, [createDateString])]),
    ]);
  };

  render() {
    const { vote, rpVote, onUpdate, matchData} = this.props;
    const accessVoteQuestion = fp.isNil(vote) ?
      div({}, []) :
      VoteQuestion({
        id: 'access-vote',
        isRendered: vote,
        label: 'Question 1:',
        question: 'Should data access be granted to this applicant?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: fp.isNil(vote) ? null : vote.voteId,
        rationale: fp.isNil(vote.rationale) ? '' : vote.rationale,
        selectedOption: fp.isNil(vote) ? null : vote.vote,
      });
    const rpVoteQuestion = fp.isNil(rpVote) ?
      div({}, []) :
      VoteQuestion({
        id: 'rp-vote',
        isRendered: rpVote,
        label: 'Question 2:',
        question: 'Was the research purpose accurately converted to a structured format?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: fp.isNil(rpVote) ? null : rpVote.voteId,
        rationale: fp.isNil(rpVote.rationale) ? '' : rpVote.rationale,
        selectedOption: fp.isNil(rpVote) ? null : rpVote.vote,
      });
    return div({ id: 'chair-vote' }, [
      accessVoteQuestion,
      rpVoteQuestion,
      div({ style: LINK_SECTION }, [
        a({ style: LINK, onClick: this.toggleMatchData }, [
          'View DUOS algorithm decision',
          span({ className: 'glyphicon glyphicon-menu-down', style: { marginLeft: '6px' } })
        ])
      ]),
      div({ style: {color: this.state.viewMatchResults ? 'inherit' : 'transparent'} }, [
        this.formatMatchData(matchData)
      ])
    ]);
  }
});
