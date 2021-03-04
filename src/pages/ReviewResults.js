import React from 'react';
import {div, h, span} from 'react-hyperscript-helpers';
import {DarApplication} from './access_review/DarApplication';
import {AccessReviewHeader} from './access_review/AccessReviewHeader';
import {DAR, DataSet, Election, Researcher, Votes} from '../libs/ajax';
import {Notifications} from '../libs/utils';
import * as fp from 'lodash/fp';
import ApplicationDownloadLink from "../components/ApplicationDownloadLink";
import {VoteSummary} from "./access_review/VoteSummary";
import {AppSummary} from "./access_review/AppSummary";

const SECTION = {
  margin: '10px auto',
};

class ReviewResults extends React.PureComponent {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      voteAsChair: (props.location && props.location.state ? props.location.state.chairFinal : false)
    };
  }

  componentDidMount() {
    this.darReviewAccess();
  }

  async darReviewAccess() {
    const darId = this.props.match.params.referenceId;
    // Access Election Information
    // const getElectionInformation = async (darId) => {
    //   try {
    //     const accessElection = await Election.findElectionByDarId(darId);
    //     console.log(accessElection);
    //     const rpElectionReview = fp.isNil(accessElection) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
    //     console.log(rpElectionReview);
    //     const rpElection = fp.isNil(rpElectionReview) ? null : rpElectionReview.election;
    //     return {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection};
    //   } catch (error) {
    //     Notifications.showError({text: 'Error initializing Election Data'});
    //     return Promise.reject(error);
    //   }
    // };

    const getDarData = async (darId) => {
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
      return {datasets, darInfo, consent, researcherProfile};
    };

    const [electionData, darData, allVotes] = await Promise.all([
      //getElectionInformation(darId),
      getDarData(darId),
      //Vote information
      Votes.getDarVotes(darId),
    ]);
    const {datasets, darInfo, consent, researcherProfile} = darData;
    //const {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection} = electionData;

    this.setState({
      allVotes,
      darId,
      darInfo,
      consent,
      researcherProfile,
      datasets
    });
  }

  render() {
    const {
      voteAsChair,
      darInfo,
      darId,
      accessElection,
      consent,
      accessElectionReview,
      rpElectionReview,
      researcherProfile,
      datasets
    } = this.state;
    const {history, match} = this.props;
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
