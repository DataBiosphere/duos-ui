import React from 'react';
import { div, a, span, button, hh } from 'react-hyperscript-helpers';
import { Votes, Election, Match } from '../../libs/ajax';
import { StackdriverReporter } from '../../libs/stackdriverReporter';
import { Storage } from '../../libs/storage';
import { Theme } from '../../libs/theme';
import { Navigation, Notifications } from '../../libs/utils';
import { VoteAsMember } from './VoteAsMember';
import { VoteAsChair } from './VoteAsChair';
import {cloneDeep, find, getOr, isNil, isEmpty, isEqual, omit} from 'lodash/fp';

const ROOT = {
  height: '100%',
  fontFamily: 'Arial',
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
      chairFinalVote: null,
      chairAgreementVote: null,
      memberAccessVote: null,
      memberRpVote: null,
      accessElectionOpen: false,
      rpElectionOpen: false
    };
  }

  /**
   * gets final access vote data for the access and rp elections
   * this is called when VoteAsChair mounts
   */
  getVotesAsChair = async () => {
    const { agreementVotes, finalVotes, chairVotes, accessElection, rpElection } = this.props;
    const chairAgreementVote = isNil(accessElection) ? null : find({ electionId: accessElection.electionId })(agreementVotes);
    const chairFinalVote = isNil(accessElection) ? null : find({ electionId: accessElection.electionId })(finalVotes);
    const chairAccessVote = isNil(accessElection) ? null : find({ electionId: accessElection.electionId })(chairVotes);
    const chairRpVote = isNil(rpElection) ? null : find({ electionId: rpElection.electionId })(chairVotes);
    const accessElectionOpen = isNil(accessElection) ? false : !isEqual(accessElection.status)('Closed');
    const rpElectionOpen = isNil(rpElection) ? false : !isEqual(rpElection.status)('Closed');
    this.setState({
      alert: '',
      chairAgreementVote: chairAgreementVote,
      chairFinalVote: chairFinalVote,
      chairAccessVote: chairAccessVote,
      chairRpVote: chairRpVote,
      accessElectionOpen: accessElectionOpen,
      rpElectionOpen: rpElectionOpen
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
    const { chairVotes, memberVotes, accessElection, rpElection } = this.props;
    const chairAccessVote = isNil(accessElection) ? null : find({ electionId: accessElection.electionId })(chairVotes);
    const memberAccessVote = isNil(accessElection) ? null : find({ electionId: accessElection.electionId })(memberVotes);
    const memberRpVote = isNil(rpElection) ? null : find({ electionId: rpElection.electionId })(memberVotes);
    const accessElectionOpen = isNil(accessElection) ? false : !isEqual(accessElection.status)('Closed');
    const rpElectionOpen = isNil(rpElection) ? false : !isEqual(rpElection.status)('Closed');
    this.setState({
      alert: '',
      chairAccessVote: chairAccessVote,
      memberAccessVote: memberAccessVote,
      memberRpVote: memberRpVote,
      accessElectionOpen: accessElectionOpen,
      rpElectionOpen: rpElectionOpen
    });
  };

  /**
   * updates the vote object with the given vote ID in state
   * this is called when changes are made to input buttons/fields
   */
  updateMemberVote = (voteId, voteStatus, rationale) => {
    const { memberAccessVote, memberRpVote } = this.state;
    const isAccessVote = voteId === (isNil(memberAccessVote) ? null : memberAccessVote.voteId);
    const isRpVote = voteId === (isNil(memberRpVote) ? null : memberRpVote.voteId);
    let voteClone;

    if (isAccessVote) {
      voteClone = cloneDeep(memberAccessVote);
    } else if (isRpVote) {
      voteClone = cloneDeep(memberRpVote);
    }

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    }
    if (!isNil(rationale)) {
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
    const { history } = this.props;
    const { chairAccessVote, memberAccessVote, memberRpVote } = this.state;
    if (memberRpVote) {
      if (!isNil(memberAccessVote) && !isNil(memberAccessVote.vote)) {
        this.submitVote(memberAccessVote);
        //not required but if there is an rp vote submit it
        if (!isNil(memberRpVote) && !isNil(memberRpVote.vote)) {
          this.submitVote(memberRpVote);
        }
        // Navigate back if this member doesn't have chairperson votes to complete
        if (isNil(chairAccessVote)) {
          Navigation.back(Storage.getCurrentUser(), history);
        }
      } else {
        this.setState({ alert: 'incomplete' });
      }
    } else {
      if (!isNil(memberAccessVote) && !isNil(memberAccessVote.vote)) {
        this.submitVote(memberAccessVote);
        // Navigate back if this member doesn't have chairperson votes to complete
        if (isNil(chairAccessVote)) {
          Navigation.back(Storage.getCurrentUser(), history);
        }
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
    const isAccessVote = voteId === (isNil(chairAccessVote) ? null : chairAccessVote.voteId);
    const isRpVote = voteId === (isNil(chairRpVote) ? null : chairRpVote.voteId);
    let voteClone;

    if (isAccessVote) {
      voteClone = cloneDeep(chairAccessVote);
    } else if (isRpVote) {
      voteClone = cloneDeep(chairRpVote);
    }

    if (voteStatus !== null) {
      voteClone.vote = voteStatus;
    }
    if (!isNil(rationale)) {
      voteClone.rationale = rationale;
    }

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
    const { history, accessElection, rpElection } = this.props;
    const { chairFinalVote, chairAccessVote, chairRpVote } = this.state;
    // If an RP vote exists, we need to submit both votes to complete the election.
    // If not, only the access vote is required.
    if (!isNil(chairRpVote)) {
      if (!isNil(chairAccessVote.vote) && !isNil(chairRpVote.vote)) {
        await this.submitVote(chairAccessVote);
        await this.submitVote(chairRpVote);

        chairFinalVote.vote = chairAccessVote.vote;
        chairFinalVote.rationale = chairAccessVote.rationale;
        await this.submitVote(chairFinalVote);
        await this.submitAgreementVote();
        await this.closeElection(accessElection, chairAccessVote.vote, chairAccessVote.rationale);
        await this.closeElection(rpElection, chairRpVote.vote, chairRpVote.rationale);
        Navigation.back(Storage.getCurrentUser(), history);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    } else {
      if (!isNil(chairAccessVote) && !isNil(chairAccessVote.vote)) {
        await this.submitVote(chairAccessVote);
        chairFinalVote.vote = chairAccessVote.vote;
        chairFinalVote.rationale = chairAccessVote.rationale;
        await this.submitVote(chairFinalVote);
        await this.submitAgreementVote();
        await this.closeElection(accessElection, chairAccessVote.vote, chairAccessVote.rationale);
        Navigation.back(Storage.getCurrentUser(), history);
      } else {
        this.setState({ alert: 'incomplete' });
      }
    }
  };

  /**
   * Compares the chairperson's access vote to the matching algorithm decision.
   * If they both are the same, then the agreement vote is TRUE. If they differ,
   * the agreement vote is FALSE.
   */
  submitAgreementVote = async () => {
    const { chairAgreementVote, chairAccessVote, matchData } = this.state;
    if (!isNil(getOr(matchData, 'match', null))) {
      if (!isNil(chairAgreementVote)) {
        chairAgreementVote.rationale = chairAccessVote.rationale;
        chairAgreementVote.vote = chairAccessVote.vote && matchData.match;
        await this.submitVote(chairAgreementVote);
      } else {
        await StackdriverReporter.report("Invalid Chair Agreement vote for Chair Access Vote: " + JSON.stringify(chairAccessVote));
      }
    }
  };

  // posts the supplied vote for this DAR
  submitVote = async (vote) => {
    const { darId } = this.props;
    // filter `createDate` from the vote object so we're not trying to update that field.
    const votePayload = omit(['createDate'])(vote);
    try {
      if (vote.type === 'FINAL') {
        // submit a final access vote.
        await Votes.updateFinalAccessDarVote(darId, votePayload);
      } else if (vote.createDate === null) {
        await Votes.postDarVote(darId, votePayload);
      } else {
        await Votes.updateDarVote(darId, votePayload);
      }
      this.setState({ alert: 'success' });
    }
    catch (e) {
      Notifications.showError({ text: `The vote could not be logged. Error code: ${e.status}` });
    }
  };

  // closes the election for this DAR
  closeElection = async (election, vote, rationale) => {
    const electionClone = cloneDeep(election);
    electionClone.status = 'Closed';
    electionClone.finalVote = vote;
    electionClone.finalAccessVote = vote;
    electionClone.finalRationale = rationale;
    try {
      await Election.updateElection(electionClone.electionId, electionClone);
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
    const { voteAsChair, selectChair, chairVotes, libraryCards } = this.props;
    const { alert, chairAccessVote, chairRpVote, memberAccessVote, memberRpVote, matchData, accessElectionOpen, rpElectionOpen } = this.state;

    // If we have an open election, theme the button based on the alert status.
    // If we do not, set it to disabled state.
    const voteButtonStyle = (accessElectionOpen || rpElectionOpen) ?
      (alert === 'success') ? { backgroundColor: Theme.palette.success } : {} :
      { backgroundColor: Theme.palette.disabled, cursor: 'not-allowed'};

    // If we have an open election, we can submit votes as either a chair or member.
    // If we do not, we cannot submit any votes.
    const voteButtonAction = (accessElectionOpen || rpElectionOpen) ?
      (!isEmpty(chairVotes) && voteAsChair) ? this.submitChairVote : this.submitMemberVote :
      () => {};

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
            isRendered: !isEmpty(chairVotes),
            style: voteAsChair ? TAB_SELECTED : TAB_UNSELECTED,
            onClick: () => selectChair(true),
          },
          [span({
            isRendered: !isEmpty(chairVotes),
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
              accessElectionOpen: accessElectionOpen,
              rpElectionOpen: rpElectionOpen
            }),
            VoteAsChair({
              isRendered: voteAsChair,
              getVotes: this.getVotesAsChair,
              getMatchData: this.getMatchData,
              onUpdate: this.updateChairVotes,
              matchData: matchData,
              vote: chairAccessVote,
              rpVote: chairRpVote,
              accessElectionOpen: accessElectionOpen,
              rpElectionOpen: rpElectionOpen,
              libraryCards: libraryCards
            }),
            div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
              this.showAlert(alert),
              button({
                id: 'vote',
                className: 'button-contained',
                style: voteButtonStyle,
                onClick: voteButtonAction
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
