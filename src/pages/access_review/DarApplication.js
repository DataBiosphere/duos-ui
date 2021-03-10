import React from 'react';
import { div, span, hh, h } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { AppSummary } from './AppSummary';
import { VoteSummary } from './VoteSummary';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import * as fp from 'lodash/fp';

const SECTION = {
  fontFamily: 'Montserrat',
  margin: '2rem 0 1rem 0',
  color: Theme.palette.primary,
  display: 'flex',
};

const HEADER = {
  fontSize: Theme.font.size.header,
  lineHeight: Theme.font.leading.regular,
};

const HEADER_BOLD = {
  ...HEADER,
  fontWeight: Theme.font.weight.semibold,
};

export const DarApplication = hh(class DarApplication extends React.PureComponent {

  render() {
    const { voteAsChair, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets } = this.props;
    const accessVotes = fp.isNil(accessElectionReview) ? null : fp.get( 'reviewVote')(accessElectionReview);
    const rpVotes = fp.isNil(rpElectionReview) ? null : fp.get( 'reviewVote')(rpElectionReview);
    return div([
      div({ id: 'header', style: {...SECTION, display: 'flex' }}, [
        div({style: {...HEADER_BOLD}}, "Project Title: " + darInfo.projectTitle),
        div({style: {...HEADER, marginLeft: '35px'}}, ' | '),
        div({style: {...HEADER_BOLD, marginLeft: '35px', marginRight: '35px'}}, "ID: " + darInfo.darCode),
        h(ApplicationDownloadLink, {darInfo, researcherProfile, datasets})
      ]),
      VoteSummary({
        isRendered: voteAsChair && !fp.isNil(accessVotes),
        question: 'Should data access be granted to this application?',
        questionNumber: '1',
        votes: accessVotes,
      }),
      VoteSummary({
        isRendered: voteAsChair && !fp.isNil(rpVotes),
        question: 'Was the research purpose accurately converted to a structured format?',
        questionNumber: '2',
        votes: rpVotes,
      }),
      AppSummary({ darInfo, accessElection, consent, researcherProfile })
    ]);
  }
});
