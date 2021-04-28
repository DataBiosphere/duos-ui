import React from 'react';
import {div, h, hh, span} from 'react-hyperscript-helpers';
import {Theme} from '../../libs/theme';
import {AppSummary} from './AppSummary';
import {VoteSummary} from './VoteSummary';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import { isNil, get, find } from 'lodash/fp';
const SECTION = {
  fontFamily: 'Arial',
  margin: '1rem 0',
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
    const { voteAsChair, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets, matchData } = this.props;
    const accessVotes = isNil(accessElectionReview) ? null : get( 'reviewVote')(accessElectionReview);
    const rpVotes = isNil(rpElectionReview) ? null : get( 'reviewVote')(rpElectionReview);
    const datasetName = isNil(datasets) ? "" : (find({propertyName: "Dataset Name"})(datasets[0].properties)).propertyValue;
    //only render the page if the data has been populated to avoid errors downstream
    return !isNil(datasets) && !isNil(researcherProfile) ?
      div([
        div({id: 'header', style: SECTION}, [
          div({style: {minWidth: '50%'}}, [
            span({style: HEADER_BOLD}, darInfo.projectTitle),
            span({style: HEADER}, ' | ' + darInfo.darCode)
          ]),
          span({style: {paddingLeft: '10px'}}, [
            h(ApplicationDownloadLink, {darInfo, researcherProfile, datasets})
          ])
        ]),
        div({style: SECTION}, [
          span({style: HEADER_BOLD}, ["Dataset: "]),
          span({style: {...HEADER, paddingLeft: "5px"}}, [datasetName])
        ]),
        VoteSummary({
          isRendered: voteAsChair && !isNil(accessVotes),
          question: 'Should data access be granted to this application?',
          questionNumber: '1',
          votes: accessVotes,
          matchData: matchData
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
