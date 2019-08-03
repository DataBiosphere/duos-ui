import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, ul, li, label, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DAR, Election, Files, Votes } from '../libs/ajax';
import * as DataAccessRequest from '../components/DataAccessRequest';
import { Storage } from '../libs/storage';
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { Alert } from '../components/Alert';

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
        }).catch(error => {
          this.setState({ showConfirmationDialogOK: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
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
        }).catch(error => {
          this.setState({ showConfirmationDialogOK: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
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
        }).catch(error => {
          this.setState({ showConfirmationDialogOK: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
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
        }).catch(error => {
          this.setState({ showConfirmationDialogOK: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
        });
    }

  };

  back = () => {
    const user = this.state.currentUser;
    const page = user.isChairPerson ? '/chair_console' :
      user.isMember ? '/member_console' :
        user.isAdmin ? '/admin_console' :
          user.isResearcher ? '/dataset_catalog?reviewProfile' :
            user.isDataOwner ? '/data_owner_console' :
              user.isAlumni ? '/summary_votes' : '/';
    this.props.history.push(page);
  }

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
    const voteId = this.props.match.params.voteId;
    const consent = await DAR.getDarConsent(darId);
    const election = await Election.findElectionByDarId(darId);
    const vote = await Votes.getDarVote(darId, voteId);
    const darInfo = await DAR.describeDar(darId);

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
      prev.darInfo = darInfo;
      prev.darInfo.sDar = election.translatedUseRestriction;
      prev.election = election;
      prev.rpVote = rpVote;
      if (!darInfo.hasPurposeStatements) {
        prev.darInfo.purposeStatements = [];
      }
      if (election.useRestriction !== null && rpVote !== null) {
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

      darInfo: {
        projectTitle: '',
        havePI: false,
        pi: '',
        profileName: '',
        status: '',
        hasAdminComment: false,
        adminComment: '',
        institution: '',
        department: '',
        city: '',
        country: '',
        purposeManualReview: false,
        researchTypeManualReview: false,
        hasDiseases: false,
        purposeStatements: [],
        researchType: [],
        diseases: [],
        rus: '',
        sDar: '',
      },
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

    const { voteId, rpVoteId } = this.state;

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "accessReview", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Data Access Congruence Review"}),
            DataAccessRequest.details({
              projectTitle: this.state.darInfo.projectTitle,
              darCode: this.state.darInfo.darCode,
              datasetId: this.state.darInfo.datasetId,
              datasetName: this.state.darInfo.datasetName,
              consentName: this.state.consentName
            })
          ]),

          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({
              id: "btn_back",
              onClick: this.back,
              className: "btn-primary btn-back"
            }, [
                i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
              ])
          ]),

        ]),

        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            id: "accessReview",
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
              : "Should data access be granted to this applicant?",
            expanded: this.state.isQ1Expanded
          }, [

              hr({ className: "section-separator", style: { 'marginTop': '0' } }),
              h4({ className: "hint" }, ["Please review the Application Summary and Data Use Limitations to determine if the researcher should be granted access to the data"]),

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Application Summary"]),
                  ]),

                  div({ id: "panel_applicationSummary", className: "panel-body row" }, [
                    div({ className: "col-lg-4 col-md-5 col-sm-5 col-xs-12" }, [

                      div({ isRendered: this.state.darInfo.havePI, className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["PI: "]),
                        span({ id: "lbl_principalInvestigator", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.pi]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Researcher: "]),
                        span({ id: "lbl_researcher", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.profileName]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label no-padding" }, ["Status: "]),
                        span({ id: "lbl_researcherStatus", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.status]),
                      ]),
                      div({ isRendered: this.state.darInfo.hasAdminComment, className: "row no-margin" }, [
                        span({}, [
                          label({ className: "control-label no-padding" }, ["Comments: "]),
                          span({ id: "lbl_adminComment", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.adminComment]),
                        ])
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label no-padding" }, ["NIH Library Card: "]),
                        div({ className: 'library-flag ' + (this.state.hasLibraryCard ? 'flag-enabled' : 'flag-disabled') }, [
                          div({ className: "library-icon"}),
                          span({ className: "library-label"}, "Library Card")
                        ])
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Institution: "]),
                        span({ id: "lbl_institution", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.institution]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Department: "]),
                        span({ id: "lbl_department", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.department]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["City: "]),
                        span({ id: "lbl_state", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.city]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Country: "]),
                        span({ id: "lbl_country", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.country]),
                      ]),
                      button({ id: "btn_downloadFullApplication", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
                    ]),

                    div({ className: "col-lg-8 col-md-7 col-sm-7 col-xs-12" }, [

                      div({ className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Research Purpose"]),
                        div({ id: "lbl_rus", className: "response-label" }, [this.state.darInfo.rus]),
                      ]),

                      div({ isRendered: this.state.darInfo.hasPurposeStatements, className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Purpose Statement"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.purposeStatements.map((purpose, rIndex) => {
                              return h(Fragment, { key: rIndex }, [
                                li({ id: "lbl_purposeStatement_" + rIndex, className: purpose.manualReview ? 'cancel-color' : '' }, [
                                  b({}, [purpose.title]), purpose.description
                                ])
                              ]);
                            })
                          ]),
                          div({ isRendered: this.state.darInfo.purposeManualReview && !this.state.darInfo.researchTypeManualReview, className: "summary-alert" }, [
                            Alert({ id: "purposeStatementManualReview", type: "danger", title: "This research involves studying a sensitive population and requires manual review." })
                          ])
                        ])
                      ]),

                      div({ className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Type of Research"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.researchType.map((type, rIndex) => {
                              return h(Fragment, { key: rIndex }, [
                                li({ id: "lbl_researchType_" + rIndex, className: type.manualReview ? 'cancel-color' : '' }, [
                                  b({}, [type.title]), type.description
                                ]),
                              ]);
                            })
                          ])
                        ])
                      ]),
                      div({ isRendered: this.state.darInfo.researchTypeManualReview, className: "summary-alert" }, [
                        Alert({ id: "researchTypeManualReview", type: "danger", title: "This research requires manual review." })
                      ]),

                      div({ isRendered: this.state.darInfo.hasDiseases, className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Disease area(s)"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.diseases.map((disease, rIndex) => {
                              return h(Fragment, { key: rIndex }, [
                                li({ id: "lbl_disease_" + rIndex }, [
                                  disease
                                ]),
                              ]);
                            })
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),

                div({ className: "col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead dul-color" }, [
                    h4({}, ["Data Use Limitations"]),
                  ]),
                  div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
                    div({ className: "row dar-summary" }, [
                      div({ className: "control-label dul-color" }, ["Structured Limitations"]),
                      div({ className: "response-label translated-restriction", dangerouslySetInnerHTML: { __html: this.state.translatedUseRestriction } }, [])
                    ]),
                  ]),
                ]),
              ]),

              div({ className: "row no-margin" }, [

                div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
                  div({ className: "jumbotron box-vote access-background-lighter" }, [
                    SubmitVoteBox({
                      id: "accessReview",
                      color: "access",
                      title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
                        : "Should data access be granted to this applicant?",
                      disabled: this.state.disableQ1Btn,
                      voteStatus: this.state.vote.vote != null ? this.state.vote.vote : null,
                      rationale: this.state.vote.rationale !== null ? this.state.vote.rationale : '',
                      action: { label: "Vote", handler: this.submitVote },
                      showAlert: this.state.alertRPVote,
                      alertMessage: 'Remember to log a vote on: 2. Was the research purpose accurately converted to a structured format?',
                      key: voteId
                    })
                  ])
                ])
              ])
            ])
        ]),


        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            isRendered: this.state.hasUseRestriction,
            id: "rpReviewVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: "Q2. Was the research purpose accurately converted to a structured format?",
            expanded: this.state.isQ2Expanded
          }, [

              hr({ className: "section-separator", style: { 'marginTop': '0' } }),
              h4({ className: "hint" }, ["Please review the Research Purpose and determine if it was appropriately converted to a Structured Research Purpose"]),

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Research Purpose"]),
                  ]),
                  div({ id: "panel_researchPurpose", className: "panel-body cm-boxbody" }, [
                    div({ style: { 'marginBottom': '10px' } }, [this.state.darInfo.rus]),
                    button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
                  ])
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Structured Research Purpose"]),
                  ]),
                  div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML: { __html: this.state.darInfo.sDar } }, []),
                ]),
              ]),

              div({ className: "row no-margin" }, [
                div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
                  div({ className: "jumbotron box-vote access-background-lighter" }, [
                    SubmitVoteBox({
                      id: "rpReview",
                      color: "access",
                      title: "Q2. Was the research purpose accurately converted to a structured format?",
                      disabled: this.state.disableQ2Btn,
                      voteStatus: this.state.rpVote !== null && this.state.rpVote.vote !== null ? this.state.rpVote.vote : undefined,
                      rationale: this.state.rpVote !== null && this.state.rpVote.rationale !== null ? this.state.rpVote.rationale : '',
                      action: { label: "Vote", handler: this.submitRpVote },
                      showAlert: this.state.alertVote,
                      alertMessage: 'Remember to log a vote on: 1. Should data access be granted to this applicant?',
                      key: rpVoteId
                    }),
                  ])
                ])
              ])
            ])
        ]),
        ConfirmationDialog({
          isRendered: this.state.showConfirmationDialogOK,
          title: "Vote confirmation",
          color: "access",
          type: "informative",
          showModal: true,
          action: { label: "Ok", handler: this.confirmationHandlerOK }
        }, [div({ className: "dialog-description" }, [this.state.alertMessage])])
      ])
    );
  }
}

export default AccessReview;
