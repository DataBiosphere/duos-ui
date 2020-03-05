import React from 'react';
import _ from 'lodash';
import { div, a, span, button, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Storage } from "../libs/storage";
import { Votes } from '../libs/ajax';
import { VoteAsMember } from './VoteAsMember';
import { VoteAsChair } from './VoteAsChair';

const ROOT = {
  height: '100%',
  fontFamily: 'Montserrat',
  fontSize: Theme.font.size.small,
  lineHeight: Theme.font.leading.dense,
  fontWeight: Theme.font.weight.semibold,
  textTransform: 'uppercase',
  color: Theme.palette.primary,
};

const TAB_UNSELECTED = {
  width: '50%',
  textAlign: 'center',
  padding: '16px',
  color: Theme.palette.secondary,
};

const TAB_SELECTED = {
  ...TAB_UNSELECTED,
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '9px 9px 0px 0px',
  color: Theme.palette.primary,
};

const VOTE_MEMBER = {
  height: 'calc(100% - 50px)',
  backgroundColor: Theme.palette.background.secondary,
  borderRadius: '0px 9px 9px 9px',
  padding: '24px'
};

const VOTE_CHAIR = {
  ...VOTE_MEMBER,
  borderRadius: '9px 0px 9px 9px',
};

const LINK = {
  color: Theme.palette.link,
  fontWeight: '400',
  textTransform: 'none',
  lineHeight: Theme.font.size.small,
};

const LINK_SECTION = {
  display: 'flex',
  margin: '24px 0px',
  alignContent: 'center',
};

export const DacVotePanel = hh(class DacVotePanel extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      vote: null,
      rpVote: null,
      finalVote: null,
    };
  };

  /**
   * gets data for access vote and, if it exists, rp vote
   * this is called when VoteAsMember mounts
   */
  getVotesAsMember = async () => {
    const { darId, voteId, rpVoteId } = this.props.ids;
    try {
      const vote = await Votes.getDarVote(darId, voteId);
      this.setState({ vote });
    }
    catch (e) {
      console.log('Something went wrong trying to get the data.')
    };
    if (rpVoteId) {
      try {
        const rpVote = await Votes.getDarVote(darId, rpVoteId);
        this.setState({ rpVote });
      }
      catch (e) {
        console.log('Something went wrong trying to get the data.')
      };
    };
  };

  /**
   * updates the vote object with the given vote ID in state
   * this is called when changes are made to input buttons/fields
   */
  updateMemberVote = (voteId, voteStatus, rationale) => {
    const { vote, rpVote } = this.state;
    const isAccessVote = voteId === vote.voteId;
    const isRpVote = voteId === rpVote.voteId;
    let voteClone;

    if (isAccessVote) {
      voteClone = _.cloneDeep(vote);
    } else if (isRpVote) {
      voteClone = _.cloneDeep(rpVote);
    };

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    };
    if (!_.isUndefined(rationale)) {
      voteClone.rationale = rationale;
    }; // rationale can be null!

    // set state of vote or rpVote depending on vote ID
    const stateObj = isAccessVote ? { vote: voteClone }
      : isRpVote ? { rpVote: voteClone }
        : {};
    this.setState(stateObj);
  }

  // checks if required fields are completed before posting votes
  submitMemberVote = () => {
    const { vote, rpVote } = this.state;
    if (rpVote) {
      if (vote.vote !== null && rpVote.vote !== null) {
        this.submitVote(vote);
        this.submitVote(rpVote);
      } else {
        console.log('Please complete all required fields');
      };
    } else {
      if (vote.vote !== null) {
        this.submitVote(vote);
      } else {
        console.log('Please complete all required fields');
      };
    }
  };

  // posts the supplied vote for this DAR
  async submitVote(vote) {
    const { darId } = this.props.ids;
    if (vote.createDate === null) {
      try {
        await Votes.postDarVote(darId, vote);
        console.log('Vote sumbitted');
      }
      catch (e) {
        console.log('Something went wrong. Try again.')
      };
    } else {
      try {
        await Votes.updateDarVote(darId, vote);
        console.log('Vote edited');
      }
      catch (e) {
        console.log('Something went wrong. Try again.')
      };
    }
  };

  render() {
    const { isChairPerson } = Storage.getCurrentUser();
    const { voteAsChair, selectChair } = this.props;
    const { vote, rpVote, finalVote } = this.state;

    return div({ style: ROOT },
      [
        div({ id: 'tabs', style: { display: 'flex' } }, [
          a({
            id: 'vote-as-member',
            style: voteAsChair ? TAB_UNSELECTED : TAB_SELECTED,
            onClick: () => selectChair(false),
          },
            [span({ style: { opacity: '70%' } }, "Vote As Member")]),
          a({
            id: 'vote-as-chair',
            isRendered: isChairPerson,
            style: voteAsChair ? TAB_SELECTED : TAB_UNSELECTED,
            onClick: () => selectChair(true),
          },
            [span({ style: { opacity: '70%' } }, "Vote As Chair")])
        ]),
        div({ style: voteAsChair ? VOTE_CHAIR : VOTE_MEMBER, },
          [
            VoteAsMember({
              isRendered: !voteAsChair,
              getVotes: this.getVotesAsMember,
              onUpdate: this.updateMemberVote,
              vote,
              rpVote,
            }),
            VoteAsChair({
              isRendered: isChairPerson && voteAsChair, finalVote,
            }),
            div(
              { isRendered: voteAsChair, style: LINK_SECTION }, [
              a({ style: LINK }, "View DUOS algorithm decision")
            ]),
            div({ style: { textAlign: 'end' } }, [
              button({
                id: 'vote',
                className: 'button-contained',
                onClick: voteAsChair ? this.submitChairVote : this.submitMemberVote,
              },
                "Vote")
            ])
          ])
      ]
    );
  }
});
