import React from 'react';
import { div, a, span, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { VoteQuestion } from './VoteQuestion';
import {isNil, head, get} from 'lodash/fp';
import * as moment from 'moment';
import {processMatchData} from '../../utils/VoteUtils';

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

const ERROR = {
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'none',
  margin: '12px 0',
  color: 'red'
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
  }

  toggleMatchData = () => {
    this.setState(prev => {
      prev.viewMatchResults = !prev.viewMatchResults;
      return prev;
    });
    // Changing state here doesn't trigger a re-render hence the need to force update.
    this.forceUpdate();
  };

  formatMatchData = (matchData) => {
    const voteString = processMatchData(matchData);
    const createDateString = moment(get('createDate')(matchData)).format('YYYY-MM-DD');
    const style = { marginLeft: '2rem', fontWeight: 'normal', textTransform: 'none' };
    return div({}, [
      div({},['DUOS Algorithm Decision:', span({style: style}, [voteString])]),
      div({},['Date:', span({style: style}, [createDateString])]),
    ]);
  };

  render() {
    const { vote, rpVote, onUpdate, matchData, accessElectionOpen, rpElectionOpen, libraryCards } = this.props;
    const hasLibraryCard = !isNil(head(libraryCards));
    const errorMessage = 'The Researcher must have a Library Card before data access can be granted. You can still deny this request and/or vote on question 2.';
    const accessVoteQuestion = isNil(vote) ?
      div({}, []) :
      VoteQuestion({
        id: 'access-vote',
        isRendered: !isNil(vote),
        label: 'Question 1:',
        question: 'Should data access be granted to this applicant?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: isNil(vote) ? null : vote.voteId,
        rationale: isNil(vote.rationale) ? '' : vote.rationale,
        selectedOption: isNil(vote) ? null : vote.vote,
        disabled: !accessElectionOpen,
        hasLibraryCard: hasLibraryCard
      });
    const rpVoteQuestion = isNil(rpVote) ?
      div({}, []) :
      VoteQuestion({
        id: 'rp-vote',
        isRendered: !isNil(rpVote),
        label: 'Question 2:',
        question: 'Was the research purpose accurately converted to a structured format?',
        updateVote: (id, selectedOption, rationale) => onUpdate(id, selectedOption, rationale),
        voteId: isNil(rpVote) ? null : rpVote.voteId,
        rationale: isNil(rpVote.rationale) ? '' : rpVote.rationale,
        selectedOption: isNil(rpVote) ? null : rpVote.vote,
        disabled: !rpElectionOpen
      });
    return div({ id: 'chair-vote' }, [
      div({ style: ERROR, isRendered: hasLibraryCard === false}, [errorMessage]),
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
