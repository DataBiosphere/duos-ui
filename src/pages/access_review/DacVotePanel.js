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
      finalVote: null,
    };
  };

  /**
   * gets final access vote data for the access and rp elections
   * this is called when VoteAsChair mounts
   */
  getVotesAsChair = async () => {
    const { memberVotes, chairVotes, finalVotes, agreementVotes, accessElection, rpElection } = this.props;
    this.setState({
      alert: '',
      memberVotes: memberVotes,
      chairVotes: chairVotes,
      finalVotes: finalVotes,
      agreementVotes: agreementVotes,
      accessElection: accessElection,
      rpElection: rpElection
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
    }
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
      voteClone = fp.cloneDeep(vote);
    } else if (isRpVote) {
      voteClone = fp.cloneDeep(rpVote);
    }

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    }
    if (!fp.isNil(rationale)) {
      voteClone.rationale = rationale;
    } // rationale can be null!

    // set state of vote or rpVote depending on vote ID
    const stateObj = isAccessVote ? { vote: voteClone }
      : isRpVote ? { rpVote: voteClone }
        : {};
    this.setState(stateObj);
  };

  // checks if required fields are completed before posting votes
  submitMemberVote = () => {
    const { vote, rpVote } = this.state;
    if (rpVote) {
      if (vote.vote !== null && rpVote.vote !== null) {
        this.submitVote(vote);
        this.submitVote(rpVote);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    } else {
      if (vote.vote !== null) {
        this.submitVote(vote);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    }
    this.props.updateVote();
  };

  /**
   * updates the election's final vote information in state
   * this is called when changes are made to input buttons/fields
   */
  updateChairVotes = (id, option, rationale) => {
    const { accessElection, rpElection } = this.state;
    if (accessElection.electionId === id) {
      const accessElectionClone = fp.cloneDeep(accessElection);
      accessElectionClone.finalVote = option;
      accessElectionClone.finalAccessVote = option;
      accessElectionClone.finalRationale = rationale;
      this.setState({
        accessOption: option,
        accessRationale: rationale,
        accessElection: accessElectionClone
      });
    }
    if (rpElection.electionId === id) {
      const rpElectionClone = fp.cloneDeep(rpElection);
      rpElectionClone.finalVote = option;
      rpElectionClone.finalAccessVote = option;
      rpElectionClone.finalRationale = rationale;
      this.setState({
        rpElection: rpElectionClone,
        rpOption: option,
        rpRationale: rationale,
      });
    }
  };

  /**
   * Submits the final vote information for the elections in state.
   * This sets BOTH the `finalVote` and `finalAccessVote` values for each election.
   */
  submitChairVote = async () => {
    // const { accessElection, rpElection } = this.state;
    // try {
    //   const { accessOption, accessRationale } = this.state;
    //   if (!fp.isNil(accessOption)) {
    //     const accessClone = fp.cloneDeep(accessElection);
    //     accessClone.finalAccessVote = accessOption;
    //     accessClone.finalVote = accessOption;
    //     accessClone.finalRationale = accessRationale;
    //     await Election.updateElection(accessElection.electionId, accessClone);
    //   }
    // }
    // catch (e) {
    //   Notifications.showError({ text: `The vote could not be logged. Error code: ${e.status}` });
    // }
    // try {
    //   const { rpOption, rpRationale } = this.state;
    //   if (!fp.isNil(rpOption)) {
    //     const rpClone = fp.cloneDeep(rpElection);
    //     rpClone.finalAccessVote = rpOption;
    //     rpClone.finalVote = rpOption;
    //     rpClone.finalRationale = rpRationale;
    //     await Election.updateElection(rpElection.electionId, rpClone);
    //   }
    // }
    // catch (e) {
    //   Notifications.showError({ text: `The vote could not be logged. Error code: ${e.status}` });
    // }
    // this.props.updateVote();
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
    const { memberVotes, chairVotes, finalVotes, agreementVotes, accessElection, rpElection, vote, rpVote, alert, matchData } = this.state;

    const chairAccessVote = fp.first(fp.isNil(accessElection) ? {} : fp.filter({ electionId: accessElection.electionId })(chairVotes));
    const chairRpVote = fp.first(fp.isNil(rpElection) ? {} : fp.filter({ electionId: rpElection.electionId })(chairVotes));

    const memberAccessVote = fp.first(fp.isNil(accessElection) ? {} : fp.filter({ electionId: accessElection.electionId })(memberVotes));
    const memberRpVote = fp.first(fp.isNil(rpElection) ? {} : fp.filter({ electionId: rpElection.electionId })(memberVotes));

    console.log(JSON.stringify(chairAccessVote));
    console.log(JSON.stringify(chairRpVote));
    console.log(JSON.stringify(memberAccessVote));
    console.log(JSON.stringify(memberRpVote));

    console.log(JSON.stringify(memberVotes));
    console.log(JSON.stringify(chairVotes));

    return div({ style: ROOT },
      [
        div({ id: 'tabs', style: { display: 'flex' } }, [
          a({
            id: 'vote-as-member',
            style: (isUserChairForDataset && voteAsChair) ? TAB_UNSELECTED : TAB_SELECTED,
            onClick: () => selectChair(false),
          },
          [span({ style: { opacity: '70%' } }, 'Vote As Member')]),
          a({
            id: 'vote-as-chair',
            isRendered: isUserChairForDataset,
            style: (isUserChairForDataset && voteAsChair) ? TAB_SELECTED : TAB_UNSELECTED,
            onClick: () => selectChair(true),
          },
          [span({
            isRendered: isUserChairForDataset,
            style: { opacity: '70%' }
          }, 'Vote As Chair')])
        ]),
        div({ style: (isUserChairForDataset && voteAsChair) ? VOTE_CHAIR : VOTE_MEMBER, },
          [
            VoteAsMember({
              isRendered: (!isUserChairForDataset && !voteAsChair),
              getVotes: this.getVotesAsMember,
              onUpdate: this.updateMemberVote,
              vote,
              rpVote,
            }),
            div({
              isRendered: (isUserChairForDataset && voteAsChair)
            }, [
              VoteAsChair({
                getVotes: this.getVotesAsChair,
                getMatchData: this.getMatchData,
                onUpdate: this.updateChairVotes,
                matchData,
                chairAccessVote,
                chairRpVote
              }),
              div({},[
                "Completing these votes also closes the election with current results."
              ]),
            ]),
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
