import React from 'react';
import {div, h, span} from 'react-hyperscript-helpers';
import {AccessReviewHeader} from './access_review/AccessReviewHeader';
import {DAR, DataSet, Researcher, Votes} from '../libs/ajax';
import {Notifications} from '../libs/utils';
import * as fp from 'lodash/fp';
import ApplicationDownloadLink from "../components/ApplicationDownloadLink";
import {VoteSummary} from "./access_review/VoteSummary";
import {AppSummary} from "./access_review/AppSummary";
import { Election } from '../../libs/ajax';

const SECTION = {
  margin: '10px auto',
};

class ReviewResults extends React.PureComponent {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      voteAsChair: (props.location && props.location.state ? props.location.state.chairFinal : false),
      darInfo: null,
      datasets: null,
      consent: null,
      researcherProfile: null
    };
  }

  componentDidMount() {
    this.darReviewAccess();
  }

  darReviewAccess() {
    const darId = this.props.match.params.referenceId;
    this.getDarData(darId);
    this.getAllVotes(darId);
  }

  getDarData = async (darId) => {
    let datasets;
    let darInfo;
    let consent;
    let researcherProfile;

    try {
      darInfo = await DAR.getPartialDarRequest(darId);
      // Researcher information
      const researcherPromise = Researcher.getResearcherProfile(darInfo.userId);
      const datasetsPromise = darInfo.datasetIds.map((id) => {
        return DataSet.getDataSetsByDatasetId(id);
      });
      const consentPromise = DAR.getDarConsent(darId);
      [consent, datasets, researcherProfile] = await Promise.all([
        consentPromise,
        Promise.all(datasetsPromise),
        researcherPromise
      ]);
    } catch (error) {
      Notifications.showError({text: 'Error initializing DAR Data'});
      return Promise.reject(error);
    }
    this.setState((prev) => {
      prev.datasets = datasets;
      prev.darInfo = darInfo;
      prev.consent = consent;
      prev.researcherProfile = researcherProfile;
      return prev;
    })
  };

  getAllVotes = async (darId) => {
    const allVotes = await Votes.getDarVotes(darId);
    this.setState((prev) => {
      prev.allVotes = allVotes;
    })
  };

  getElectionInformation = async (darId) => {
    let accessElection;
    try {
      const accessElection = await Election.findElectionByDarId(darId);
    } catch (error) {
      //access election is null
    }
    try {
      const rpElectionReview = fp.isNil(accessElection) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
      console.log(rpElectionReview);
      const rpElection = fp.isNil(rpElectionReview) ? null : rpElectionReview.election;
      return {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection};
    } catch (error) {
      Notifications.showError({text: 'Error initializing Election Data'});
      return Promise.reject(error);
    }
  };


    //const {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection} = electionData;


  render() {
    const {history, match} = this.props;
    const {voteAsChair, darInfo, datasets, consent, researcherProfile } = this.state;
    const accessVotes = fp.isNil(accessElectionReview) ? null : fp.get( 'reviewVote')(accessElectionReview);
    const rpVotes = fp.isNil(rpElectionReview) ? null : fp.get( 'reviewVote')(rpElectionReview);

    return div({isRendered: darInfo != null, id: 'container', paddingLeft: "16px" },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({history, match})]
        ),
        div({id: 'body', style: {display: 'flex'}}, [
          div(
            {
              id: 'application',
              style: {
                ...SECTION,
                width: '80%',
              }
            },
            // [DarApplication({
            //   voteAsChair,
            //   darId,
            //   darInfo,
            //   accessElection,
            //   consent,
            //   accessElectionReview,
            //   rpElectionReview,
            //   researcherProfile,
            //   datasets
            // })]
            div([
              div({ id: 'header', style: SECTION }, [
                div({ style: { minWidth: '50%' } }, [
                  span({ style: '16px'}, darInfo.projectTitle),
                  span({ style: '12px'}, ' | ' + darInfo.darCode)
                ]),
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
            ])
          )
        ])
      ]
    );
  }
}

export default ReviewResults;
