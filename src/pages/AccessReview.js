import * as ld from 'lodash';
import { Component } from 'react';
import { a, button, div, h4, hr, i } from 'react-hyperscript-helpers';
import { ApplicationSummary } from '../components/ApplicationSummary';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataAccessRequest } from '../components/DataAccessRequest';
import { PageHeading } from '../components/PageHeading';
import { StructuredDarRp } from '../components/StructuredDarRp';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { DAR, Election, Files, Researcher, Votes } from '../libs/ajax';
import { Models } from '../libs/models';
import { Storage } from '../libs/storage';
import { Theme } from '../libs/theme';
import { Navigation } from '../libs/utils';


class AccessReview extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  componentDidMount() {
    this.darReviewAccess();
    this.submitRpVote = this.submitRpVote.bind(this);
    this.submitVote = this.submitVote.bind(this);
  }

  submitRpVote = (voteStatus, rationale) => {
    let vote = this.state.rpVote;
    this.setState({ disableQ2Btn: true });
    vote.vote = voteStatus;
    vote.rationale = rationale;

    if (this.state.rpVote.createDate === null) {
      Votes.postDarVote(this.state.election.referenceId, vote).then(
        data => {
          this.alertVoteRemember();
          this.setState(prev => {
            prev.alertRPVote = false;
            prev.showConfirmationDialogOK = true;
            return prev;
          });
        }
      ).catch(
        error => {
          this.setState(
            { showConfirmationDialogOK: true, alertMessage: 'Sorry, something went wrong when trying to submit the vote. Please try again.' });
        });
    } else {
      Votes.updateDarVote(this.state.election.referenceId, vote).then(
        data => {
          this.alertVoteRemember();
          this.setState(prev => {
            prev.alertRPVote = false;
            prev.showConfirmationDialogOK = true;
            return prev;
          });
        }
      ).catch(
        error => {
          this.setState(
            { showConfirmationDialogOK: true, alertMessage: 'Sorry, something went wrong when trying to submit the vote. Please try again.' });
        });
    }

  };

  submitVote = (voteStatus, rationale) => {
    let vote = this.state.vote;
    this.setState({ disableQ1Btn: true });
    vote.vote = voteStatus;
    vote.rationale = rationale;

    if (this.state.vote.createDate === null) {
      Votes.postDarVote(this.state.election.referenceId, vote).then(
        data => {
          this.setState(prev => {
            prev.alertMessage = 'Your vote has been successfully logged!';
            prev.alertVote = false;
            prev.showConfirmationDialogOK = true;
            return prev;
          });
          this.alertRPVoteRemember();
        }
      ).catch(
        error => {
          this.setState(
            { showConfirmationDialogOK: true, alertMessage: 'Sorry, something went wrong when trying to submit the vote. Please try again.' });
        });
    } else {
      Votes.updateDarVote(this.state.election.referenceId, vote).then(
        data => {
          this.setState(prev => {
            prev.alertMessage = 'Your vote has been successfully edited!';
            prev.alertVote = false;
            prev.showConfirmationDialogOK = true;
            return prev;
          });
        }
      ).catch(
        error => {
          this.setState(
            { showConfirmationDialogOK: true, alertMessage: 'Sorry, something went wrong when trying to submit the vote. Please try again.' });
        });
    }

  };

  alertRPVoteRemember = () => {
    if (this.state.hasUseRestriction && this.state.vote.vote !== null && this.state.rpVote.vote === null) {
      this.setState(prev => {
        prev.alertRPVote = true;
        return prev;
      });
    } else {
      this.setState(prev => {
        prev.alertRPVote = false;
        return prev;
      });
    }
  };

  alertVoteRemember = () => {
    if (this.state.rpVote.vote !== null && !this.state.alertVote && this.state.vote.vote === null) {
      this.setState(prev => {
        prev.alertVote = true;
        return prev;
      });
    } else {
      this.setState(prev => {
        prev.alertVote = false;
        return prev;
      });
    }
  };


  async darReviewAccess() {
    // dar
    const darId = this.props.match.params.darId;
    await DAR.describeDar(darId).then(
      darInfo => {
        Researcher.getResearcherProfile(darInfo.researcherId).then(
          researcherProfile => {
            this.setState(prev => {
              prev.darInfo = darInfo;
              prev.researcherProfile = researcherProfile;
              return prev;
            });
          });
      }
    );
    const voteId = this.props.match.params.voteId;
    const consent = await DAR.getDarConsent(darId);
    let election;
    try {
      election = await Election.findElectionByDarId(darId);
    } catch (e) {
      console.error(e);
    }
    const vote = await Votes.getDarVote(darId, voteId);

    let rpVote, rpVoteId;

    if (this.props.match.params.rpVoteId !== undefined) {
      rpVoteId = this.props.match.params.rpVoteId;
      rpVote = await Votes.getDarVote(darId, rpVoteId);
    } else {
      rpVoteId = null;
      rpVote = null;
    }

    this.setState(prev => {
      prev.consentName = consent.name;
      prev.consentId = consent.consentId;
      prev.election = election;
      prev.rpVote = rpVote;
      if (!ld.isNil(election) && !ld.isNil(election.useRestriction) && !ld.isNil(rpVote)) {
        prev.hasUseRestriction = true;
      } else {
        prev.hasUseRestriction = false;
      }
      prev.vote = vote;
      prev.voteId = voteId;
      return prev;
    });

    Election.findConsentElectionByDarElection(vote.electionId).then(data => {
      if (data.dulName !== null && data.dulElection !== null) {
        this.setState({
          dulName: data.dulName,
          translatedUseRestriction: data.translatedUseRestriction
        });
      } else {
        this.setState({
          dulName: consent.dulName,
          translatedUseRestriction: consent.translatedUseRestriction
        });
      }
    });
  }

  confirmationHandlerOK = (answer) => (e) => {
    this.setState({ showConfirmationDialogOK: false });

    if (!this.state.alertRPVote && (!this.state.alertVote || this.state.vote.vote !== null)) {
      this.props.history.goBack();
    }
  };

  initialState() {
    let currentUser = Storage.getCurrentUser();

    return {
      currentUser: currentUser,
      showConfirmationDialogOK: false,
      alertMessage: 'Your vote has been successfully logged!',
      hasUseRestriction: false,
      hasLibraryCard: false,
      consentName: '',
      consentId: '',
      dulName: '',
      translatedUseRestriction: '',
      isQ1Expanded: true,
      disableQ1Btn: false,
      isQ2Expanded: false,
      disableQ2Btn: false,
      rpVote: {
        vote: '',
        rational: ''
      },
      election: {},
      vote: {},
      alertVote: false,
      alertRPVote: false,

      darInfo: Models.dar,
      researcherProfile: null,
      voteId: null,
      rpVoteId: null
    };
  }

  downloadDAR = () => {
    Files.getDARFile(this.props.match.params.darId);
  };

  toggleQ1 = (e) => {
    this.setState(prev => {
      prev.isQ1Expanded = !prev.isQ1Expanded;
      return prev;
    });

  };

  toggleQ2 = (e) => {
    this.setState(prev => {
      prev.isQ2Expanded = !prev.isQ2Expanded;
      return prev;
    });
  };

  render() {

    const { darInfo, researcherProfile, hasUseRestriction, voteId, rpVoteId } = this.state;

    return (

      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'accessReview', imgSrc: '/images/icon_access.png', iconSize: 'medium',
              color: 'access', title: 'Data Access Congruence Review'
            }),
            DataAccessRequest({
              isRendered: !ld.isEmpty(darInfo.datasets),
              dar: darInfo,
              consentName: this.state.consentName
            })
          ]),

          div({ className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
            a({
              id: 'btn_back',
              onClick: () => Navigation.back(this.state.currentUser, this.props.history),
              className: 'btn-primary btn-back'
            }, [
              i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
            ])
          ])

        ]),

        div({ className: 'row no-margin' }, [
          CollapsiblePanel({
            id: 'accessReview',
            onClick: this.toggleQ1,
            color: 'access',
            title: hasUseRestriction ? 'Q1. Should data access be granted to this applicant?'
              : 'Should data access be granted to this applicant?',
            expanded: this.state.isQ1Expanded
          }, [

            hr({ className: 'section-separator', style: { 'marginTop': '0' } }),
            h4({ className: 'hint' },
              ['Please review the Application Summary and Data Use Limitations to determine if the researcher should be granted access to the data']),

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

              ApplicationSummary({
                isRendered: !ld.isNil(darInfo) && !ld.isNil(this.state.researcherProfile),
                mrDAR: null,
                hasUseRestriction: hasUseRestriction,
                darInfo: darInfo,
                downloadDAR: this.downloadDAR,
                researcherProfile: researcherProfile }),

              div({ className: 'col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead dul-color' }, [
                  h4({}, ['Data Use Limitations'])
                ]),
                div({ id: 'panel_dul', className: 'panel-body cm-boxbody' }, [
                  div({ className: 'row dar-summary' }, [
                    div({ className: 'control-label dul-color' }, ['Structured Limitations']),
                    div({
                      className: 'response-label translated-restriction', dangerouslySetInnerHTML: { __html: this.state.translatedUseRestriction }
                    }, [])
                  ])
                ])
              ])
            ]),

            div({ className: 'row no-margin' }, [

              div({ className: 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12' }, [
                div({ className: 'jumbotron box-vote access-background-lighter' }, [
                  SubmitVoteBox({
                    id: 'accessReview',
                    color: 'access',
                    title: hasUseRestriction ? 'Q1. Should data access be granted to this applicant?'
                      : 'Should data access be granted to this applicant?',
                    disabled: this.state.disableQ1Btn,
                    voteStatus: this.state.vote.vote != null ? this.state.vote.vote : null,
                    rationale: this.state.vote.rationale !== null ? this.state.vote.rationale : '',
                    action: { label: 'Vote', handler: this.submitVote },
                    showAlert: this.state.alertRPVote,
                    alertMessage: 'Remember to log a vote on: 2. Was the research purpose accurately converted to a structured format?',
                    key: voteId
                  })
                ])
              ])
            ])
          ])
        ]),


        div({ className: 'row no-margin' }, [
          CollapsiblePanel({
            isRendered: hasUseRestriction,
            id: 'rpReviewVotes',
            onClick: this.toggleQ1,
            color: 'access',
            title: 'Q2. Was the research purpose accurately converted to a structured format?',
            expanded: this.state.isQ2Expanded
          }, [

            hr({ className: 'section-separator', style: { 'marginTop': '0' } }),
            h4({ className: 'hint' },
              ['Please review the Research Purpose and determine if it was appropriately converted to a Structured Research Purpose']),

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead access-color' }, [
                  h4({}, ['Research Purpose'])
                ]),
                div({ id: 'panel_researchPurpose', className: 'panel-body cm-boxbody' }, [
                  div({ style: { 'marginBottom': '10px' } }, [darInfo.rus]),
                  button({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color', onClick: this.downloadDAR },
                    ['Download Full Application'])
                ])
              ]),

              div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
                div({ className: 'panel-heading cm-boxhead access-color' }, [
                  h4({}, ['Structured Research Purpose'])
                ]),
                div({id: 'panel_structuredDul', className: 'panel-body cm-boxbody translated-restriction'}, [
                  StructuredDarRp({
                    darInfo: darInfo,
                    headerStyle: { display: 'none' },
                    textStyle: Theme.legacy
                  })
                ])
              ])
            ]),

            div({ className: 'row no-margin' }, [
              div({ className: 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12' }, [
                div({ className: 'jumbotron box-vote access-background-lighter' }, [
                  SubmitVoteBox({
                    id: 'rpReview',
                    color: 'access',
                    title: 'Q2. Was the research purpose accurately converted to a structured format?',
                    disabled: this.state.disableQ2Btn,
                    voteStatus: this.state.rpVote !== null && this.state.rpVote.vote !== null ? this.state.rpVote.vote : undefined,
                    rationale: this.state.rpVote !== null && this.state.rpVote.rationale !== null ? this.state.rpVote.rationale : '',
                    action: { label: 'Vote', handler: this.submitRpVote },
                    showAlert: this.state.alertVote,
                    alertMessage: 'Remember to log a vote on: 1. Should data access be granted to this applicant?',
                    key: rpVoteId
                  })
                ])
              ])
            ])
          ])
        ]),
        ConfirmationDialog({
          isRendered: this.state.showConfirmationDialogOK,
          title: 'Vote confirmation',
          color: 'access',
          type: 'informative',
          showModal: true,
          action: { label: 'Ok', handler: this.confirmationHandlerOK }
        }, [div({ className: 'dialog-description' }, [this.state.alertMessage])])
      ])
    );
  }
}

export default AccessReview;
