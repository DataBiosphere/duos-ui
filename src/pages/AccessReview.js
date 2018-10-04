import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, ul, li, label, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DAR, Election, Files, Votes } from '../libs/ajax';
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { LoadingIndicator } from '../components/LoadingIndicator';

class AccessReview extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  componentDidMount() {
    this.setState(prev => {
      prev.currentUser = {
        roles: [
          { name: 'CHAIRPERSON' },
          { name: 'ADMIN' },
        ]
      };
      return prev;
    });
    this.darReviewAccess();
    this.submitRpVote = this.submitRpVote.bind(this);
    this.submitVote = this.submitVote.bind(this);
  }

  submitRpVote = (voteStatus, rationale) => {
    let vote = this.state.rpVote;

    vote.vote = voteStatus;
    vote.rationale = rationale;

    if (this.state.rpVote.createDate === null) {
      Votes.postDarVote(this.state.election.referenceId, vote).then(
        data => {
          this.alertVoteRemember();
          this.setState(prev => {
            prev.alertrpVote = false;
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
            prev.alertrpVote = false;
            prev.showConfirmationDialogOK = true;
            return prev;
          });
        }).catch(error => {
        this.setState({ showConfirmationDialogOK: true, alertMessage: "Sorry, something went wrong when trying to submit the vote. Please try again." });
      });
    }

  };

  submitVote(voteStatus, rationale) {
    let vote = this.state.vote;

    vote.vote = voteStatus;
    vote.rationale = rationale;

    if (this.state.vote.createDate === null) {
      Votes.postDarVote(this.state.election.referenceId, vote).then(
        data => {
          this.setState(prev => {
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
    this.props.history.goBack();
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
    const rusDarData = await DAR.getDarFields(this.props.match.params.darId, 'rus');
    const consent = await DAR.getDarConsent(this.props.match.params.darId);
    const election = await Election.findElectionByDarId(this.props.match.params.darId);
    const vote = await Votes.getDarVote(this.props.match.params.darId, this.props.match.params.voteId);
    const request = await DAR.getDarFields(this.props.match.params.darId, 'projectTitle');
    const darInfo = await DAR.describeDar(this.props.match.params.darId);
    const rpVote = this.props.match.params.rpVoteId !== 'null' ?  await Votes.getDarVote(this.props.match.params.darId, this.props.match.params.rpVoteId) : null;

    this.setState(prev => {
      prev.consentName = consent.name;
      prev.consentId = consent.consentId;
      prev.projectTitle = request.projectTitle;
      prev.darInfo = darInfo;
      prev.darInfo.rus = rusDarData.rus;
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
      return prev;
    });

    Election.findConsentElectionByDarElection(vote.electionId).then(data => {
      if (data.dulName !== null && data.dulElection !== null) {
        this.setState({dulName: data.dulName});
      } else {
        this.setState({dulName: consent.dulName});
      }
    });


    this.setState({
      loading: false
    });
    
    
  }

  confirmationHandlerOK = (answer) => (e) => {
    this.setState({ showConfirmationDialogOK: false });

    if (!this.state.alertRPVote && (!this.state.alertVote || this.state.vote.vote !== null)) {
      this.props.history.goBack();
    }
  };

  initialState() {
    return {
      loading: true,
      showConfirmationDialogOK: false,
      alertMessage: "Your vote has been successfully logged!",
      hasUseRestriction: false,
      projectTitle: '',
      consentName: '',
      consentId: '',
      dulName: '',
      isQ1Expanded: true,
      isQ2Expanded: false,
      rpVote: {
        vote: '',
        rational: ''
      },
      election: {},
      vote: {},
      alertVote: false,
      alertRPVote: false,

      darInfo: {
        havePI: true,
        pi: '',
        profileName: '',
        status: '',
        hasAdminComment: true,
        adminComment: '',
        institution: '',
        department: '',
        city: '',
        country: '',
        purposeManualReview: true,
        researchTypeManualReview: true,
        hasDiseases: true,
        purposeStatements: [],
        researchType: [],
        diseases: [],
        rus: '',
        sDar: '',
      }
    };
  }

  downloadDAR = () => {
    Files.getDARFile(this.props.match.params.darId);
  };

  downloadDUL = (e) => {
    Files.getDulFile(this.state.consentId, this.state.dulName);
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

    const { loading } = this.state;

    if (loading) {
      return LoadingIndicator();
    }

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.projectTitle]),
      this.state.consentName
    ]);

    let userRoles = {
      member: 'MEMBER',
      chairperson: "CHAIRPERSON"
    };

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "accessReview", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Data Access Congruence Review", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            this.state.currentUser.roles.map((rol, ind) => {
              return (
                a({ id: "btn_back", onClick: () => this.back(), key: ind, isRendered: rol.name === userRoles.member, className: "btn vote-button vote-button-back vote-button-bigger" }, [
                  i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
                ])
              );
            }),
            this.state.currentUser.roles.map((rol, ind) => {
              return (
                a({ id: "btn_back", href: "/chair_console", key: ind, isRendered: rol.name === userRoles.chairperson, className: "btn vote-button vote-button-back vote-button-bigger" }, [
                  i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
                ])
              );
            }),
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
              //-----
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
                          label({ className: "control-label no-padding" }, ["Comment: "]),
                          span({ id: "lbl_adminComment", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.adminComment]),
                        ]),
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
                      button({ id: "btn_downloadFullApplication", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
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
                              return h(Fragment, {key: rIndex}, [
                                li({ id: "lbl_purposeStatement_" + rIndex, className: purpose.manualReview ? 'cancel-color' : '' }, [
                                  b({}, [purpose.title]), purpose.description
                                ])
                              ]);
                            })
                          ]),
                          div({ isRendered: this.state.darInfo.purposeManualReview && !this.state.darInfo.researchTypeManualReview, className: "dar-summary" }, [
                            div({ id: "lbl_purposeStatementManualReview", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                              "This research involves studying a sensitive population and requires manual review."
                            ]),
                          ]),
                        ]),
                      ]),

                      div({ className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Type of Research"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.researchType.map((type, rIndex) => {
                              return h(Fragment, {key: rIndex}, [
                                li({ id: "lbl_researchType_" + rIndex, className: type.manualReview ? 'cancel-color' : '' }, [
                                  b({}, [type.title]), type.description
                                ]),
                              ]);
                            })
                          ]),
                        ]),
                      ]),
                      div({ isRendered: this.state.darInfo.researchTypeManualReview, className: "row dar-summary" }, [
                        div({ id: "lbl_researchTypeManualReview", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                          "This research requires manual review."
                        ]),
                      ]),

                      div({ isRendered: this.state.darInfo.hasDiseases, className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Disease area(s)"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.diseases.map((disease, rIndex) => {
                              return h(Fragment, {key: rIndex}, [
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

                //-----
                div({ className: "col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead dul-color" }, [
                    h4({}, ["Data Use Limitations"]),
                  ]),
                  div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
                    div({ className: "row no-margin" }, [
                      button({ id: "btn_downloadDataUseLetter", className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
                    ]),
                  ]),
                ]),
              ]),

              //-----
              div({ className: "row no-margin" }, [

                div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
                  div({ className: "jumbotron box-vote access-background-lighter" }, [
                    SubmitVoteBox({
                      id: "accessReview",
                      color: "access",
                      title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
                        : "Should data access be granted to this applicant?",
                      disabled: false,
                      voteStatus: this.state.vote.vote !== null ? this.state.vote.vote : undefined,
                      rationale: this.state.vote.rationale !== null ? this.state.vote.rationale : '',
                      action: { label: "Vote", handler: this.submitVote },
                      showAlert: this.state.alertRPVote,
                      alertMessage: 'Remember to log a vote on: 2. Was the research purpose accurately converted to a structured format?'
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
                    button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
                  ])
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Structured Research Purpose"]),
                  ]),
                  div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML:{ __html: this.state.darInfo.sDar}  }, []),
                ]),
              ]),

              //-----
              div({ className: "row no-margin" }, [
                div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
                  div({ className: "jumbotron box-vote access-background-lighter" }, [
                    SubmitVoteBox({
                      id: "rpReview",
                      color: "access",
                      title: "Q2. Was the research purpose accurately converted to a structured format?",
                      disabled: false,
                      voteStatus: this.state.rpVote !== null && this.state.rpVote.vote !== null ? this.state.rpVote.vote : undefined,
                      rationale: this.state.rpVote !== null && this.state.rpVote.rationale !== null ? this.state.rpVote.rationale : '',
                      action: { label: "Vote", handler: this.submitRpVote },
                      showAlert: this.state.alertVote,
                      alertMessage: 'Remember to log a vote on: 1. Should data access be granted to this applicant?'
                    }),
                  ])
                ])
              ])
            ])
        ]),
        ConfirmationDialog({
          isRendered: this.state.showConfirmationDialogOK,
          title: "Vote confirmation",
          color: "common",
          type: "informative",
          showModal: true,
          action: { label: "Ok", handler: this.confirmationHandlerOK }
        }, [div({ className: "dialog-description" }, [this.state.alertMessage])])
      ])
    );
  }
}

export default AccessReview;

