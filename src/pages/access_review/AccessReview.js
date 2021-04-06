import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { DarApplication } from './DarApplication';
import { AccessReviewHeader } from './AccessReviewHeader';
import { DacVotePanel } from './DacVotePanel';
import { Election, Votes} from '../../libs/ajax';
import { getDarData, Notifications } from '../../libs/utils';
import { Storage } from '../../libs/storage';
import { isNil, filter } from 'lodash/fp';

const SECTION = {
  margin: '16px',
};

class AccessReview extends React.PureComponent {
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
    const { darId } = this.props.match.params;

    // Access Election Information
    const getElectionInformation = async(darId) => {
      try{
        const accessElection = await Election.findElectionByDarId(darId);
        const accessElectionReview = await Election.findDataAccessElectionReview(accessElection.electionId, false);
        const rpElectionReview = isNil(accessElection) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
        const rpElection = isNil(rpElectionReview) ? null : rpElectionReview.election;
        return {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection};
      } catch(error) {
        Notifications.showError({text: 'Error initializing Election Data'});
        return Promise.reject(error);
      }
    };

    const [darData, allVotes, electionData] = await Promise.all([
      getDarData(darId),
      //Vote information
      Votes.getDarVotes(darId),
      getElectionInformation(darId)
    ]);
    const {datasets, darInfo, consent, researcherProfile} = darData;
    const {accessVote, accessElectionReview, accessElection, rpElectionReview, rpElection} = electionData;

    this.setState({ allVotes, darId, accessVote, accessElection, rpElection, darInfo, consent, accessElectionReview, rpElectionReview, researcherProfile, datasets });
  }

  render() {
    const { allVotes, voteAsChair, darInfo, darId, accessElection, consent, accessElectionReview, rpElection, rpElectionReview, researcherProfile, datasets } = this.state;
    const { history, match } = this.props;

    const currentUser = Storage.getCurrentUser();
    const memberVotes = filter({ type: 'DAC', dacUserId: currentUser.dacUserId })(allVotes);
    const chairVotes = filter({ type: 'Chairperson', dacUserId: currentUser.dacUserId })(allVotes);
    const finalVotes = filter({ type: 'FINAL', dacUserId: currentUser.dacUserId })(allVotes);
    const agreementVotes = filter({ type: 'AGREEMENT', dacUserId: currentUser.dacUserId })(allVotes);
    const dacChairMessage = "DAC Chairs can optionally vote as a member.";

    return div({ isRendered: darInfo != null, id: 'container', style: { margin: 'auto' } },
      [
        div(
          {
            id: 'header', style: SECTION
          },
          [AccessReviewHeader({ match, message: dacChairMessage })]
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
export default AccessReview;
