import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { DarApplication } from './DarApplication';
import { AccessReviewHeader } from './AccessReviewHeader';
import { DacVotePanel } from './DacVotePanel';
import { DAC, DAR, Election, Votes } from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import * as fp from 'lodash/fp';

const SECTION = {
  margin: '16px',
};

class AccessReviewV2 extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  initialState() {
    return {
      voteAsChair: false,
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
    const accessVote = await Votes.getDarVote(darId, voteId);
    const accessElection = await Election.findElectionById(accessVote.electionId);
    const accessElectionReview = await Election.findDataAccessElectionReview(accessVote.electionId, false);

    // RP Election Information.
    // N.B. We get the rpElectionReview from the Access election id, not the rp election id. This is a legacy behavior.
    const rpVote = await Votes.getDarVote(darId, rpVoteId);
    const rpElection = await Election.findElectionById(rpVote.electionId);
    const rpElectionReview = await Election.findRPElectionReview(accessElection.electionId, false);

    const { darInfo, consent } = await DAR.describeDarWithConsent(darId);

    // Vote information
    const allVotes = await Votes.getDarVotes(darId);

    // User in dataset DAC information
    const isUserChairForDataset = await DAC.isUserChairForDataset(Storage.getCurrentUser().dacUserId, accessElection.dataSetId);

    this.setState({ isUserChairForDataset, allVotes, darId, voteId, rpVoteId, accessVote, accessElection, rpVote, rpElection, darInfo, consent, accessElectionReview, rpElectionReview });
  }

  render() {
    const { isUserChairForDataset, allVotes, voteAsChair, darInfo, darId, accessElection, consent, accessElectionReview, rpElection, rpElectionReview } = this.state;
    const { history, match } = this.props;
    const ids = match.params;

    const currentUser = Storage.getCurrentUser();
    const memberVotes = fp.filter({ type: 'DAC', dacUserId: currentUser.dacUserId })(allVotes);
    const chairVotes = fp.filter({ type: 'Chairperson', dacUserId: currentUser.dacUserId })(allVotes);
    // const finalVotes = fp.filter({ type: 'FINAL', dacUserId: currentUser.dacUserId })(allVotes);
    // const agreementVotes = fp.filter({ type: 'Agreement', dacUserId: currentUser.dacUserId })(allVotes);

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
            [DacVotePanel({ isUserChairForDataset, memberVotes, chairVotes, darId, accessElection, rpElection, consent, voteAsChair, selectChair: this.selectChair, updateVote: this.updateVote })]
          ),
          div(
            {
              id: 'application',
              style: {
                ...SECTION,
                width: '70%',
              }
            },
            [DarApplication({ voteAsChair, darInfo, accessElection, consent, accessElectionReview, rpElectionReview })]
          )
        ])
      ]
    );
  }
}
export default AccessReviewV2;
