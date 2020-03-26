import React from 'react';
import _ from 'lodash';
import { div, a, span, button, hh } from "react-hyperscript-helpers";
import { Theme } from '../libs/theme';
import { Storage } from "../libs/storage";
import { Notifications } from "../libs/utils";
import { Votes, Election } from '../libs/ajax';
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
   * gets data for final access vote
   * this is called when VoteAsChair mounts
   */
  getVotesAsChair = async () => {
    this.setState({ alert: '' });
    const { electionId } = this.props.election;
    try {
      const finalVote = await Votes.getDarFinalAccessVote(electionId);
      this.setState({ finalVote });
    }
    catch (e) {
      Notifications.showError({ text: `Something went wrong trying to get the votes. Error code: ${e.status}` });
    };
  };

  /**
   * gets data for access vote and, if it exists, rp vote
   * this is called when VoteAsMember mounts
   */
  getVotesAsMember = async () => {
    this.setState({ alert: '' });
    const { darId, voteId, rpVoteId } = this.props.ids;
    try {
      const vote = await Votes.getDarVote(darId, voteId);
      this.setState({ vote });
      if (rpVoteId) {
        const rpVote = await Votes.getDarVote(darId, rpVoteId);
        this.setState({ rpVote });
      }
    }
    catch (e) {
      Notifications.showError({ text: `Something went wrong trying to get the votes. Error code: ${e.status}` });
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

  /**
   * updates the final vote object in state
   * this is called when changes are made to input buttons/fields
   */
  updateChairVote = (voteStatus, rationale) => {
    const { finalVote } = this.state;
    const voteClone = _.cloneDeep(finalVote);

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    };
    if (!_.isUndefined(rationale)) {
      voteClone.rationale = rationale;
    }; // rationale can be null!

    this.setState({ finalVote: voteClone });
  }

  // checks if required fields are completed before posting votes
  submitMemberVote = () => {
    const { vote, rpVote } = this.state;
    if (rpVote) {
      if (vote.vote !== null && rpVote.vote !== null) {
        this.submitVote(vote);
        this.submitVote(rpVote);
      } else {
        this.setState({ alert: 'incomplete' });
      };
    } else {
      if (vote.vote !== null) {
        this.submitVote(vote);
      } else {
        this.setState({ alert: 'incomplete' });
      };
    }
  };

  // checks if required fields are completed before posting votes
  submitChairVote = () => {
    const { finalVote } = this.state;
    if (finalVote.vote !== null) {
      this.submitVote(finalVote);
      this.closeElection();
    } else {
      this.setState({ alert: 'incomplete' });
    };
  };

  // posts the supplied vote for this DAR
  async submitVote(vote) {
    const { darId } = this.props.ids;
    try {
      if (vote.type === 'FINAL') {
        await Votes.updateFinalAccessDarVote(darId, vote);
      } else if (vote.createDate === null) {
        await Votes.postDarVote(darId, vote);
      } else {
        await Votes.updateDarVote(darId, vote);
      }
      this.setState({ alert: 'success' });
    }
    catch (e) {
      Notifications.showError({ text: `The vote could not be logged. Error code: ${e.status}` });
    }
  };

  // closes the election for this DAR
  async closeElection() {
    const { election } = this.props;
    const electionClone = _.cloneDeep(election);
    electionClone.status = 'Closed';
    try {
      await Election.updateElection(election.electionId, electionClone);
    }
    catch (e) {
      Notifications.showError({ text: `Something went wrong. Error code: ${e.status}` });
    }
  };

  // gives feedback to the voter in the form of an inline alert
  showAlert = alert => {
    let msg, type;
    switch (alert) {
      case 'incomplete':
        msg = 'Please complete all required fields.';
        type = 'error';
        break;
      case 'success':
        msg = 'Vote successfully logged!';
        type = 'success';
        break;
      default:
        msg = '';
        type = 'primary';
    };
    return span({ style: { textTransform: 'none', color: Theme.palette[type] } }, msg);
  };

  render() {
    const { isChairPerson } = Storage.getCurrentUser();
    const { voteAsChair, selectChair } = this.props;
    const { vote, rpVote, finalVote, alert } = this.state;

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
              isRendered: isChairPerson && voteAsChair,
              getVotes: this.getVotesAsChair,
              onUpdate: this.updateChairVote,
              finalVote,
            }),
            div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
              this.showAlert(alert),
              button({
                id: 'vote',
                className: 'button-contained',
                style: alert === 'success' ? { backgroundColor: Theme.palette.success } : {},
                onClick: voteAsChair ? this.submitChairVote : this.submitMemberVote,
              },
                ["Vote",
                  alert === 'success' && span({ className: 'glyphicon glyphicon-ok', style: { marginLeft: '8px' } })
                ]
              )
            ]),
          ]
        )
      ]
    );
  }
});
