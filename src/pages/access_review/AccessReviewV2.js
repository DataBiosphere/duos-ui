import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { DarApplication } from './DarApplication';
import { AccessReviewHeader } from './AccessReviewHeader';
import { DacVotePanel } from './DacVotePanel';
import { DAR, Election, Votes } from '../../libs/ajax';

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
      voteAsChair: true, // TODO: Revert
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

    // RP Election Information
    const rpVote = await Votes.getDarVote(darId, rpVoteId);
    const rpElection = await Election.findElectionById(rpVote.electionId);
    const rpElectionReview = await Election.findRPElectionReview(rpVote.electionId, false);

    const { darInfo, consent } = await DAR.describeDarWithConsent(darId);
    this.setState({ darId, voteId, rpVoteId, accessVote, accessElection, rpVote, rpElection, darInfo, consent, accessElectionReview, rpElectionReview });
  }

  render() {
    const { voteAsChair, darInfo, accessElection, consent, accessElectionReview, rpElection, rpElectionReview } = this.state;
    const { history, match } = this.props;
    const ids = match.params;

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
            [DacVotePanel({ ids, darInfo, accessElection, rpElection, consent, voteAsChair, selectChair: this.selectChair, updateVote: this.updateVote })]
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
