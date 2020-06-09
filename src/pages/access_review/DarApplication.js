import React from 'react';
import { div, span, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { Files } from '../../libs/ajax';
import { AppSummary } from './AppSummary';
import { VoteSummary } from './VoteSummary';
import { DownloadLink } from '../../components/DownloadLink';
import * as fp from 'lodash/fp';

const SECTION = {
  fontFamily: 'Montserrat',
  margin: '2rem 0 2rem 0',
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

  downloadDAR = () => {
    const { darId } = this.props;
    Files.getDARFile(darId);
  };

  render() {
    const { voteAsChair, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile } = this.props;
    const accessVotes = fp.isNil(accessElectionReview) ? null : fp.get( 'reviewVote')(accessElectionReview);
    const rpVotes = fp.isNil(rpElectionReview) ? null : fp.get( 'reviewVote')(rpElectionReview);
    return div([
      div({ id: 'header', style: SECTION }, [
        div({ style: { minWidth: '50%' } }, [
          span({ style: HEADER_BOLD }, darInfo.projectTitle),
          span({ style: HEADER }, ' | ' + darInfo.darCode)
        ]),
        DownloadLink({ label: 'Full Application', onDownload: this.downloadDAR })
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
