import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { DarApplication } from './DarApplication';
import { AccessReviewHeader } from './AccessReviewHeader';
import { DacVotePanel } from './DacVotePanel';
import { DAR, Election, Researcher, Votes } from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import * as fp from 'lodash/fp';

const SECTION = {
  margin: '16px',
};

class AccessReviewV2 extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      voteAsChair: props.location.state.chairFinal
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
    const accessElectionReview = await Election.findDataAccessElectionReview(accessVote.electionId, false);
    const accessElection = fp.isNil(accessElectionReview) ? null : accessElectionReview.election;

    // RP Election Information. Can be null for manual review DARs.
    // N.B. We get the rpElectionReview from the Access election id, not the rp election id. This is a legacy behavior.
    const rpElectionReview = fp.isNil(rpVoteId) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
    const rpElection = fp.isNil(rpElectionReview) ? null : rpElectionReview.election;

    const { darInfo, consent } = await DAR.describeDarWithConsent(darId);

    // Vote information
    const allVotes = await Votes.getDarVotes(darId);

    // Researcher information
    const researcherProfile = await Researcher.getResearcherProfile(darInfo.researcherId);

    this.setState({ allVotes, darId, accessVote, accessElection, rpElection, darInfo, consent, accessElectionReview, rpElectionReview, researcherProfile });
  }

  render() {
    const { allVotes, voteAsChair, darInfo, darId, accessElection, consent, accessElectionReview, rpElection, rpElectionReview, researcherProfile } = this.state;
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
            [DarApplication({ voteAsChair, darId, darInfo, accessElection, consent, accessElectionReview, rpElectionReview, researcherProfile })]
          )
        ])
      ]
    );
  }
}
export default AccessReviewV2;
