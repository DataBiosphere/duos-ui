import React from 'react';
import {div, h} from 'react-hyperscript-helpers';
import {AccessReviewHeader} from './access_review/AccessReviewHeader';
import {DAR, DataSet, Election, Researcher} from '../libs/ajax';
import {Notifications} from '../libs/utils';
import * as fp from 'lodash/fp';
import {DarApplication} from "./access_review/DarApplication";

const SECTION = {
  margin: '20px',
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
      } catch (error) {
        //access election is null
        Notifications.showInformation({text: 'A data access election has not yet been created for this DAR.'});
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
  }

    render() {
     if (!fp.isNil(this.state)) {
      const voteAsChair = true;
      const {history, match} = this.props;
      const {darId, darInfo, datasets, consent, researcherProfile, accessElection, accessElectionReview, rpElectionReview } = this.state;

      return div({isRendered: !fp.isNil(this.state), id: 'container', style: {margin: '2rem'}}, [
        div({id: 'header', style: {...SECTION, padding: '1rem 0'}}, [
          AccessReviewHeader({history, match})
        ]),
        div({id: 'body', style: SECTION }, [
          DarApplication({ voteAsChair, darId, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets })
          ])
        ]);
     }
      return null;
    };
}
export default ReviewResults;
