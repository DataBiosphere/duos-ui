import React from 'react';
import * as fp from 'lodash/fp';
import { div, a, span, button, hh } from 'react-hyperscript-helpers';
import { Theme } from '../../libs/theme';
import { Notifications } from '../../libs/utils';
import { Votes, Election, Match } from '../../libs/ajax';
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
      chairAccessVote: null,
      chairRpVote: null,
      memberAccessVote: null,
      memberRpVote: null

    };
  };

  /**
   * gets final access vote data for the access and rp elections
   * this is called when VoteAsChair mounts
   */
  getVotesAsChair = async () => {
    const { chairVotes, accessElection, rpElection } = this.props;
    const chairAccessVote = fp.isNil(accessElection) ? {} : fp.find({ electionId: accessElection.electionId })(chairVotes);
    const chairRpVote = fp.isNil(rpElection) ? {} : fp.find({ electionId: rpElection.electionId })(chairVotes);
    this.setState({
      alert: '',
      chairAccessVote: chairAccessVote,
      chairRpVote: chairRpVote,
    });
  };

  /**
   * Gets the automated algorithm match information for this DAR election.
   * This is called when VoteAsChair mounts.
   */
  getMatchData = async () => {
    const { consent, accessElection } = this.props;
    try {
      const matchData = await Match.findMatch(consent.consentId, accessElection.referenceId);
      this.setState({ matchData: matchData });
    } catch (e) {
      Notifications.showError({ text: `Something went wrong trying to get match algorithm results. Error code: ${e.status}` });
    }
  };

  /**
   * gets data for access vote and, if it exists, rp vote
   * this is called when VoteAsMember mounts
   */
  getVotesAsMember = async () => {
    const { memberVotes, accessElection, rpElection } = this.props;
    const memberAccessVote = fp.isNil(accessElection) ? {} : fp.find({ electionId: accessElection.electionId })(memberVotes);
    const memberRpVote = fp.isNil(rpElection) ? {} : fp.find({ electionId: rpElection.electionId })(memberVotes);
    this.setState({
      alert: '',
      memberAccessVote: memberAccessVote,
      memberRpVote: memberRpVote
    });
  };

  /**
   * updates the vote object with the given vote ID in state
   * this is called when changes are made to input buttons/fields
   */
  updateMemberVote = (voteId, voteStatus, rationale) => {
    const { memberAccessVote, memberRpVote } = this.state;
    const isAccessVote = voteId === memberAccessVote.voteId;
    const isRpVote = voteId === memberRpVote.voteId;
    let voteClone;

    if (isAccessVote) {
      voteClone = fp.cloneDeep(memberAccessVote);
    } else if (isRpVote) {
      voteClone = fp.cloneDeep(memberRpVote);
    }

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    }
    if (!fp.isNil(rationale)) {
      voteClone.rationale = rationale;
    } // rationale can be null!

    // set state of vote or rpVote depending on vote ID
    const stateObj = isAccessVote ? { memberAccessVote: voteClone }
      : isRpVote ? { memberRpVote: voteClone }
        : {};
    this.setState(stateObj);
  };

  // checks if required fields are completed before posting votes
  submitMemberVote = () => {
    const { memberAccessVote, memberRpVote } = this.state;
    if (memberRpVote) {
      if (memberAccessVote.vote !== null && memberRpVote.vote !== null) {
        this.submitVote(memberAccessVote);
        this.submitVote(memberRpVote);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    } else {
      if (memberAccessVote.vote !== null) {
        this.submitVote(memberAccessVote);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    }
    this.props.updateVote();
  };

  /**
   * updates the election's chairperson vote information in state
   * this is called when changes are made to input buttons/fields
   */
  updateChairVotes = (voteId, voteStatus, rationale) => {
    const { chairAccessVote, chairRpVote } = this.state;
    const isAccessVote = voteId === chairAccessVote.voteId;
    const isRpVote = voteId === chairRpVote.voteId;
    let voteClone;

    if (isAccessVote) {
      voteClone = fp.cloneDeep(chairAccessVote);
    } else if (isRpVote) {
      voteClone = fp.cloneDeep(chairRpVote);
    }

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    }
    if (!fp.isNil(rationale)) {
      voteClone.rationale = rationale;
    } // rationale can be null!

    // set state of vote or rpVote depending on vote ID
    const stateObj = isAccessVote ? { chairAccessVote: voteClone }
      : isRpVote ? { chairRpVote: voteClone }
        : {};
    this.setState(stateObj);
  };

  /**
   * Submits the chair vote information for the elections in state.
   * this is called when changes are made to input buttons/fields
   */
  submitChairVote = async () => {
    const { chairAccessVote, chairRpVote } = this.state;
    if (chairRpVote) {
      if (chairAccessVote.vote !== null && chairRpVote.vote !== null) {
        this.submitVote(chairAccessVote);
        this.submitVote(chairRpVote);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    } else {
      if (chairAccessVote.vote !== null) {
        this.submitVote(chairAccessVote);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    }
    this.props.updateVote();
  };

  // posts the supplied vote for this DAR
  submitVote = async (vote) => {
    const { darId } = this.props.ids;
    try {
      if (vote.type === 'FINAL') {
        // TODO: This might need to be in the chair vote section. Members cannot
        // submit a final access vote.
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
  closeElection = async () => {
    const { accessElection } = this.state;
    const electionClone = fp.cloneDeep(accessElection);
    electionClone.status = 'Closed';
    try {
      await Election.updateElection(accessElection.electionId, electionClone);
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
    }
    return span({ style: { textTransform: 'none', color: Theme.palette[type] } }, msg);
  };

  render() {
    const { isUserChairForDataset, voteAsChair, selectChair } = this.props;
    const { alert, chairAccessVote, chairRpVote, memberAccessVote, memberRpVote, matchData } = this.state;

    // console.log(JSON.stringify(chairVotes));
    // console.log("Chair Access Vote");
    // console.log(JSON.stringify(chairAccessVote));
    // console.log("Chair RP Vote");
    // console.log(JSON.stringify(chairRpVote));

    // console.log(JSON.stringify(memberVotes));
    // console.log("Member Access Vote");
    // console.log(JSON.stringify(memberAccessVote));
    // console.log("Member RP Vote");
    // console.log(JSON.stringify(memberRpVote));

    return div({ style: ROOT },
      [
        div({ id: 'tabs', style: { display: 'flex' } }, [
          a({
            id: 'vote-as-member',
            style: voteAsChair ? TAB_UNSELECTED : TAB_SELECTED,
            onClick: () => selectChair(false),
          },
          [span({ style: { opacity: '70%' } }, 'Vote As Member')]),
          a({
            id: 'vote-as-chair',
            isRendered: isUserChairForDataset,
            style: voteAsChair ? TAB_SELECTED : TAB_UNSELECTED,
            onClick: () => selectChair(true),
          },
          [span({
            isRendered: isUserChairForDataset,
            style: { opacity: '70%' }
          }, 'Vote As Chair')])
        ]),
        div({ style: voteAsChair ? VOTE_CHAIR : VOTE_MEMBER, },
          [
            VoteAsMember({
              isRendered: !voteAsChair,
              getVotes: this.getVotesAsMember,
              onUpdate: this.updateMemberVote,
              vote: memberAccessVote,
              rpVote: memberRpVote,
            }),
            VoteAsChair({
              isRendered: voteAsChair,
              getVotes: this.getVotesAsChair,
              getMatchData: this.getMatchData,
              onUpdate: this.updateChairVotes,
              matchData: matchData,
              vote: chairAccessVote,
              rpVote: chairRpVote
            }),
            div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
              this.showAlert(alert),
              button({
                id: 'vote',
                className: 'button-contained',
                style: alert === 'success' ? { backgroundColor: Theme.palette.success } : {},
                onClick: (isUserChairForDataset && voteAsChair) ? this.submitChairVote : this.submitMemberVote,
              },
              ['Vote',
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
