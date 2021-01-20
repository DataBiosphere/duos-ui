import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { DarApplication } from './DarApplication';
import { AccessReviewHeader } from './AccessReviewHeader';
import { DacVotePanel } from './DacVotePanel';
import { DAR, Election, Researcher, Votes, DataSet } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';
import { Storage } from '../../libs/storage';
import * as fp from 'lodash/fp';

const SECTION = {
  margin: '16px',
};

class AccessReviewV2 extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      voteAsChair: (props.location && props.location.state ? props.location.state.chairFinal : false)
    };
  }

  selectChair = (selected) => {
    this.setState({ voteAsChair: selected });
  };

  updateVote = () => {
    this.darReviewAccess();
  }

  componentDidMount() {
    this.darReviewAccess();
  }

  async darReviewAccess() {
    const { darId, voteId, rpVoteId } = this.props.match.params;

    // Access Election Information
    const getElectionInformaion = async(darId, voteId) => {
      try{
        const accessVote = await Votes.getDarVote(darId, voteId);
        const accessElectionReview = await Election.findDataAccessElectionReview(accessVote.electionId, false);
        const accessElection = fp.isNil(accessElectionReview) ? null : accessElectionReview.election;
        const rpElectionReview = fp.isNil(rpVoteId) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
        const rpElection = fp.isNil(rpElectionReview) ? null : rpElectionReview.election;
        return {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection};
      } catch(error) {
        Notifications.showError({text: 'Error initializing Election Data'});
        return Promise.reject(error);
      }
    };

    const getDarData = async(darId) => {
      let datasets;
      let darInfo;
      let consent;
      let researcherProfile;

      try{
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
      } catch(error) {
        Notifications.showError({text: 'Error initializing DAR Data'});
        return Promise.reject(error);
      }
      return {datasets, darInfo, consent, researcherProfile};
    };

    const [electionData, darData, allVotes] = await Promise.all([
      getElectionInformaion(darId, voteId),
      getDarData(darId),
      //Vote information
      Votes.getDarVotes(darId),
    ]);
    const {datasets, darInfo, consent, researcherProfile} = darData;
    const {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection} = electionData;

    this.setState({ allVotes, darId, accessVote, accessElection, rpElection, darInfo, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets });
  }

  render() {
    const { allVotes, voteAsChair, darInfo, darId, accessElection, consent, accessElectionReview, rpElection, rpElectionReview, researcherProfile, datasets } = this.state;
    const { history, match } = this.props;

    const currentUser = Storage.getCurrentUser();
    const memberVotes = fp.filter({ type: 'DAC', dacUserId: currentUser.dacUserId })(allVotes);
    const chairVotes = fp.filter({ type: 'Chairperson', dacUserId: currentUser.dacUserId })(allVotes);
    const finalVotes = fp.filter({ type: 'FINAL', dacUserId: currentUser.dacUserId })(allVotes);
    const agreementVotes = fp.filter({ type: 'AGREEMENT', dacUserId: currentUser.dacUserId })(allVotes);

    return div({ isRendered: darInfo != null, id: 'container', style: { margin: 'auto' } },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({ history, match })]
        ),
        div({ id: 'body', style: { display: 'flex' } }, [
          div(
            {
              id: 'vote',
              style: {
                ...SECTION,
                width: '30%',
              }
            },
            [DacVotePanel({ history, memberVotes, chairVotes, finalVotes, agreementVotes, darId, accessElection, rpElection, consent, voteAsChair, selectChair: this.selectChair, updateVote: this.updateVote })]
          ),
          div(
            {
              id: 'application',
              style: {
                ...SECTION,
                width: '70%',
              }
            },
            [DarApplication({ voteAsChair, darId, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets })]
          )
        ])
      ]
    );
  }
}
export default AccessReviewV2;
