import React from 'react';
import {div} from 'react-hyperscript-helpers';
import {AccessReviewHeader} from './access_review/AccessReviewHeader';
import {DAR, DataSet, Researcher, Votes} from '../libs/ajax';
import {Notifications} from '../libs/utils';
import * as fp from 'lodash/fp';
import {DarApplication} from "./access_review/DarApplication";
import { Election } from '../libs/ajax';

const SECTION = {
  margin: '10px 16px',
};

class ReviewResults extends React.PureComponent {
  constructor(props) {
    super(props);
    this.props = props;
  }

  componentDidMount()  {
    const darId = this.props.match.params.referenceId;
    this.getData(darId);
  }

  async getData(darId) {

    //get information on datasets, consent, researcher, and access request
    const getDarData = async (darId) => {
      let datasets;
      let darInfo;
      let consent;
      let researcherProfile;

      try {
        darInfo = await DAR.getPartialDarRequest(darId);
        const researcherPromise = await Researcher.getResearcherProfile(darInfo.userId);
        const datasetsPromise = darInfo.datasetIds.map((id) => {
          return DataSet.getDataSetsByDatasetId(id);
        });
        const consentPromise = await DAR.getDarConsent(darId);
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


    //get information on access election and research purpose election
    const getElectionInformation = async (darId) => {
      let accessElection;
      let accessElectionReview;
      let rpElectionReview;

      try {
        accessElection = await Election.findElectionByDarId(darId);
        console.log(accessElection);
      } catch (error) {
        //access election is null
        Notifications.showError({text: 'Error initializing Data Access Election'});
      }
      try {
        accessElectionReview = fp.isNil(accessElection) ? null : await Election.findDataAccessElectionReview(accessElection.electionId, true);
        rpElectionReview = fp.isNil(accessElection) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
      } catch (error) {
        Notifications.showError({text: 'Error initializing Election Data'});
        return Promise.reject(error);
      }
      return { accessElection, accessElectionReview, rpElectionReview };
    };


    const [electionData, darData] = await Promise.all([
      getElectionInformation(darId),
      getDarData(darId)
    ]);

    const {datasets, darInfo, consent, researcherProfile} = darData;
    const {accessElectionReview, accessElection, rpElectionReview} = electionData;

    this.setState({ darId, accessElection, darInfo, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets });
    // this.setState((prev) => {
    //   prev.datasets = datasets;
    //   prev.darInfo = darInfo;
    //   prev.consent = consent;
    //   prev.researcherProfile = researcherProfile;
    //   return prev;
    //});
    // this.setState((prev) => {
    //   prev.accessElection = accessElection;
    //   prev.accessElectionReview = accessElectionReview;
    //   prev.rpElectionReview = rpElectionReview;
    //   return prev;
    // });

  }

  render() {
    if (!fp.isNil(this.state)) {
      const voteAsChair = true;
      const {history, match} = this.props;
      const {darId, darInfo, datasets, consent, researcherProfile, accessElection, accessElectionReview, rpElectionReview } = this.state;

      return div({isRendered: !fp.isNil(this.state), id: 'container'}, [
        div({id: 'header', style: SECTION}, [
          AccessReviewHeader({history, match})
        ]),
        div({isRendered: !fp.isNil(darId), id: 'application', style: {...SECTION, width: '80%'}},
          [DarApplication({
            voteAsChair,
            darId,
            darInfo,
            accessElection,
            consent,
            accessElectionReview,
            rpElectionReview,
            researcherProfile,
            datasets
          })
          ],
        )]
      );
    }
    return null;
  }
}

export default ReviewResults;
