import React from 'react';
import {div, h, hh, span} from 'react-hyperscript-helpers';
import {Theme} from '../../libs/theme';
import {AppSummary} from './AppSummary';
import {VoteSummary} from './VoteSummary';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import { isEmpty, isNil, get, filter, find } from 'lodash/fp';
import { processMatchData } from '../../utils/VoteUtils';

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

    let voteString;

    const formatMatchData = (matchData) => {
      voteString = processMatchData(matchData);
      return div({style: SECTION}, [
        div({style: HEADER_BOLD},['DUOS Algorithm Decision: ']),
        div({style: {...HEADER, paddingLeft: "5px"}}, [voteString])
      ]);
    };

    //Unlike the final vote on the access election, the final vote saved on the rpElection is not a reflection of its votes
    //the final vote saved on the rpElection is marked as true if the access request is approved, and it is marked as false
    //if the access request is denied, so we must calculate this value based on the votes for it to be accurate
    const determineRpResult = (rpVotes) => {
      const chairVotes = filter((v) => !isNil(v.vote.vote) && v.vote.type === 'Chairperson')(rpVotes);
      if (!isEmpty(chairVotes)) {
        const posVotes = filter((v) => v.vote.vote === true)(chairVotes).length;
        const negVotes = filter((v) => v.vote.vote === false)(chairVotes).length;
        return posVotes > negVotes ? "Yes" : "No";
      } else {
        const memberVotes = filter((v) => !isNil(v.vote.vote) && v.vote.type === 'DAC')(rpVotes);
        const posVotes = filter((v) => v.vote.vote === true)(memberVotes).length;
        const negVotes = filter((v) => v.vote.vote === false)(memberVotes).length;
        if (posVotes === 0 && negVotes === 0) {
          return "No decision";
        } else {
          return posVotes > negVotes ? "Yes" : "No";
        }
      }
    };

    const { voteAsChair, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets, matchData } = this.props;
    const isAdmin = !isNil(matchData);
    const formattedMatch = formatMatchData(matchData);
    const accessVotes = isNil(accessElectionReview) ? null : get('reviewVote')(accessElectionReview);
    const finalDecision = isNil(accessElectionReview) || isNil(accessElectionReview.election)  || isNil(accessElectionReview.election.finalVote) ? 'No decision'
      : accessElectionReview.election.finalVote ? 'Yes' : 'No';
    const agreement = finalDecision === voteString ? 'Yes' : 'No';
    const rpVotes = isNil(rpElectionReview) ? null : get( 'reviewVote')(rpElectionReview);
    const rpDecision = isNil(rpElectionReview) || isNil(rpElectionReview.election) || isNil(rpElectionReview.election.finalVote) ? 'No decision': determineRpResult(rpVotes);
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
        div({style: SECTION, isRendered: isAdmin }, [
          span({ style: HEADER_BOLD }, ["DAC Final DAR Decision: "]),
          span({ style: {...HEADER, paddingLeft: "5px"}}, [finalDecision])
        ]),
        div({ isRendered: isAdmin }, [
          formattedMatch
        ]),
        div({style: SECTION, isRendered: isAdmin }, [
          span({ style: HEADER_BOLD }, ["DAC vs. DUOS Algorithm Agreement: "]),
          span({ style: {...HEADER, paddingLeft: "5px"}}, [agreement])
        ]),
        div({style: SECTION, isRendered: isAdmin }, [
          span({ style: HEADER_BOLD }, ["Research Purpose Accurate: "]),
          span({ style: {...HEADER, paddingLeft: "5px"}}, [rpDecision])
        ]),
        VoteSummary({
          isRendered: voteAsChair && !isNil(accessVotes),
          question: 'Should data access be granted to this application?',
          questionNumber: '1',
          votes: accessVotes,
          isAdmin: isAdmin,
          accessElection
        }),
        VoteSummary({
          isRendered: voteAsChair && !isNil(rpVotes),
          question: 'Was the research purpose accurately converted to a structured format?',
          questionNumber: '2',
          votes: rpVotes,
          isAdmin: isAdmin,
          accessElection
        }),
        AppSummary({darInfo, accessElection, consent, researcherProfile})
      ])
      : div({});
  }
});
