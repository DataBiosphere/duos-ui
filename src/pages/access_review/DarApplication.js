import React from 'react';
import {div, h, hh, span} from 'react-hyperscript-helpers';
import {Theme} from '../../libs/theme';
import {AppSummary} from './AppSummary';
import {VoteSummary} from './VoteSummary';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import { isNil, get } from 'lodash/fp';

const SECTION = {
  fontFamily: 'Montserrat',
  margin: '2rem 0',
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
    const accessVotes = isNil(accessElectionReview) ? null : get( 'reviewVote')(accessElectionReview);
    const rpVotes = isNil(rpElectionReview) ? null : get( 'reviewVote')(rpElectionReview);
    //only render the page if the data has been populated to avoid errors downstream
    return !isNil(datasets) && !isNil(researcherProfile) ?
      div([
        div({id: 'header', style: SECTION}, [
          div({style: {minWidth: '50%'}}, [
            span({style: HEADER_BOLD}, darInfo.projectTitle),
            span({style: HEADER}, ' | ' + darInfo.darCode)
          ]),
          h(ApplicationDownloadLink, {darInfo, researcherProfile, datasets})
        ]),
        VoteSummary({
          isRendered: voteAsChair && !isNil(accessVotes),
          question: 'Should data access be granted to this application?',
          questionNumber: '1',
          votes: accessVotes,
        }),
        VoteSummary({
          isRendered: voteAsChair && !isNil(rpVotes),
          question: 'Was the research purpose accurately converted to a structured format?',
          questionNumber: '2',
          votes: rpVotes,
        }),
        AppSummary({darInfo, accessElection, consent, researcherProfile})
      ])
      : div({});
  }
});
