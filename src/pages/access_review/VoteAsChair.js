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
    const { chairAccessVote, chairRpVote, onUpdate, matchData} = this.props;
    const accessVoteQuestion = fp.isNil(chairAccessVote) ?
      div({}, []) :
      VoteQuestion({
        id: 'access-vote',
        label: 'Question 1:',
        question: 'Should data access be granted to this applicant?',
        updateVote: (accessId, accessOption, accessRationale) => onUpdate(accessId, accessOption, accessRationale),
        voteId: chairAccessVote.voteId,
        rationale: fp.isNil(chairAccessVote.rationale) ? '' : chairAccessVote.rationale,
        selectedOption: chairAccessVote.vote,
      });
    const rpVoteQuestion = fp.isNil(chairRpVote) ?
      div({}, []) :
      VoteQuestion({
        id: 'rp-vote',
        label: 'Question 2:',
        question: 'Was the research purpose accurately converted to a structured format?',
        updateVote: (rpId, rpOption, rpRationale) => onUpdate(rpId, rpOption, rpRationale),
        voteId: chairRpVote.voteId,
        rationale: fp.isNil(chairRpVote.rationale) ? '' : chairRpVote.rationale,
        selectedOption: chairRpVote.vote,
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
