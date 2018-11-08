import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { Election, DAR, Files, Email } from '../libs/ajax';
import { Config } from '../libs/config';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Storage } from "../libs/storage";
import { Alert } from '../components/Alert';

class AccessCollect extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
    this.accessCollectVote = this.accessCollectVote.bind(this);
    this.rpCollectVote = this.rpCollectVote.bind(this);
    this.confirmationHandlerOK = this.confirmationHandlerOK.bind(this);
    this.confirmationRPHandlerOK = this.confirmationRPHandlerOK.bind(this);
    this.handlerReminder = this.handlerReminder(this);
  }

  componentDidMount() {
    this.loadData();
  }

  initialState() {
    return {
      buttonDisabled: false,
      dialogTitle: 'Email Notification Sent.',
      showDialogReminder: false,
      isReminderSent: false,
      alertAccessMessage: '',
      showAlertAccess: false,
      showAlertRP: false,
      alertRPMessage: null,
      accessVote: null,
      accessRationale: null,
      rpVote: null,
      rpRationale: null,
      showConfirmationDialogOK: false,
      showConfirmationRPDialogOK: false,
      access: {
        isFormDisabled: false,
        chartData: [
          ['Results', 'Votes'],
          ['Yes', 0],
          ['No', 0],
          ['Pending', 0]
        ]
      },
      rp: {
        isFormDisabled: false,
        chartData: [
          ['Results', 'Votes'],
          ['Yes', 0],
          ['No', 0],
          ['Pending', 0]
        ]
      },
      rus: '',
      voteStatus: '',
      createDate: '',
      hasUseRestriction: false,
      projectTitle: '',
      consentName: '',
      isQ1Expanded: true,
      isQ2Expanded: false,
      electionAccess: {
        finalVote: null,
        finalRationale: null,
        finalVoteDate: null
      },
      electionRP: {
        finalVote: '',
        finalRationale: '',
        finalVoteDate: ''
      },

      voteAccessList: [],
      rpVoteAccessList: [],

      darInfo: {
        havePI: false,
        pi: '',
        profileName: '',
        status: '',
        hasAdminComment: true,
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
        diseases: []
      }
    };
  };

  handlerReminder = (e) => (voteId) => {
    this.setState(prev => {
      prev.buttonDisabled = true;
      return prev;
    });
    this.sendReminder(voteId).then(reminder => {
      this.setState(prev => {
        prev.showDialogReminder = true;
        prev.isReminderSent = true;
        prev.buttonDisabled = false;
        return prev;
      });
    }).catch(error => {
      this.setState(prev => {
        prev.showDialogReminder = true;
        prev.isReminderSent = false;
        prev.buttonDisabled = false;
        prev.dialogTitle = 'Email Notification Error.';
        return prev;
      });
    })
  };

  async sendReminder(voteId) {
    return await Email.sendReminderEmail(voteId);
  };

  dialogHandlerReminder = (answer) => (e) => {
    this.setState({ showDialogReminder: false });
  };

  confirmationHandlerOK = (answer) => async (e) => {
    if (answer === true) {
      let election = this.state.election;
      election.status = 'Final';
      election.finalVote = this.state.accessVote;
      election.finalRationale = this.state.accessRationale;
      await this.updateElection(election);
      if (this.state.showRPaccordion === false || (this.state.showRPaccordion && this.state.rpAlreadyVote)) {
        this.props.history.goBack();
      } else {
        this.setState(prev => {
          prev.accessAlreadyVote = true;
          prev.showConfirmationDialogOK = false;
          prev.alertAccessMessage = 'Remember to log a vote on: Q2. Was the research purpose accurately converted to a structured format?';
          prev.showAlertAccess = true;
          return prev;
        })
      }
    } else {
      this.setState(prev => {
        prev.showConfirmationDialogOK = false;
        return prev;
      });
    }
  };

  updateElection(election) {
    return Election.updateElection(election.electionId, election);
  };

  confirmationRPHandlerOK = (answer) => async (e) => {
    if (answer === true) {
      let election = this.state.rpElection;
      election.finalVote = this.state.rpVote;
      election.finalRationale = this.state.rpRationale;
      election.status = 'Final';
      await this.updateElection(election);
      if (this.state.accessAlreadyVote) {
        this.props.history.goBack();
      } else {
        this.setState(prev => {
          prev.rpAlreadyVote = true;
          prev.showConfirmationRPDialogOK = false;
          prev.alertRPMessage = 'Remember to log a vote on: Q1. Should data access be granted to this applicant?';
          prev.showAlertAccess = false;
          prev.showAlertRP = true;
          return prev;
        });
      }
    } else {
      this.setState(prev => {
        prev.showConfirmationRPDialogOK = false;
        return prev;
      });
    }

  };

  downloadDAR() {
    Files.getDARFile(this.state.election.referenceId);
  };

  downloadDUL() {
    Files.getDulFile(this.state.consentId, this.state.dulName);
  };

  accessCollectVote = (vote, rationale) => {
    this.setState(
      prev => {
        prev.showConfirmationDialogOK = true;
        prev.accessVote = vote;
        prev.accessRationale = rationale;
        return prev;
      }
    );
  };

  rpCollectVote = (vote, rationale) => {
    this.setState(
      prev => {
        prev.showConfirmationRPDialogOK = true;
        prev.rpVote = vote;
        prev.rpRationale = rationale;
        return prev;
      }
    );
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

  back = (e) => {
    this.props.history.goBack();
  };

  async loadData() {
    await this.findDataAccessElectionReview();
    await this.findRPElectionReview();
    await this.findDarFields();
  }

  async findDataAccessElectionReview() {
    let electionReview = await Election.findDataAccessElectionReview(this.props.match.params.electionId, false);
    this.getRPGraphData('access', electionReview.reviewVote);

    this.setState(prev => {
      prev.isQ1Expanded = true;
      prev.isQ2Expanded = false;
      prev.consentName = electionReview.associatedConsent.name;
      prev.consentId = electionReview.consent.consentId;
      prev.electionType = "access";
      prev.election = electionReview.election;
      prev.darOriginalFinalVote = electionReview.election.finalVote;
      prev.darOriginalFinalRationale = electionReview.election.finalRationale;
      prev.darOriginalFinalVoteId = electionReview.election.electionId;
      prev.downloadUrl = Config.getApiUrl() + 'consent/' + electionReview.associatedConsent.consentId + '/dul';
      prev.dulName = electionReview.consent.dulName;
      prev.status = electionReview.election.status;
      prev.accessAlreadyVote = electionReview.election.finalVote !== null ? true : false;
      prev.userestriction = electionReview.election.translatedUseRestriction === null ? "This includes sensitive research objectives that requires manual review." :
        electionReview.election.translatedUseRestriction;
      prev.voteAccessList = this.chunk(electionReview.reviewVote, 2);
      return prev;
    });
  }

  async findRPElectionReview() {
    let rpElectionReview = await Election.findRPElectionReview(this.props.match.params.electionId, false);
    if (rpElectionReview !== null && rpElectionReview.election !== undefined) {
      this.getRPGraphData('rp', rpElectionReview.reviewVote);
      this.setState(prev => {
        prev.rpElection = rpElectionReview.election;
        prev.rpVoteAccessList = this.chunk(rpElectionReview.reviewVote, 2);
        prev.showRPaccordion = true;
        prev.openAccordion = false;
        prev.rpAlreadyVote = rpElectionReview.election.finalVote !== null ? true : false;
        prev.rpOriginalFinalVote = rpElectionReview.election.finalVote;
        prev.rpOriginalFinalRationale = rpElectionReview.election.finalRationale;
        prev.rpOriginalFinalVoteId = rpElectionReview.election.electionId;
        prev.hasUseRestriction = true;
        return prev;
      });
    } else {
      this.setState(prev => {
        prev.rpVoteAccessList = [];
        prev.showRPaccordion = false;
        prev.openAccordion = true;
        return prev;
      });
    }
    this.setState(prev => {
      prev.openAccordion = true;
      return prev;
    });
  };

  chunk(arr, size) {
    var newArr = [];
    for (var i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  };

  async findDarFields() {
    let dar = await DAR.getDarFields(this.props.match.params.referenceId, "rus");
    let request = await DAR.getDarFields(this.props.match.params.referenceId, "projectTitle");
    let darInfo = await DAR.describeDar(this.props.match.params.referenceId);
    if (!darInfo.hasPurposeStatements) darInfo.purposeStatements = [];
    this.setState(prev => {
      prev.darInfo = darInfo;
      prev.rus = dar.rus;
      prev.projectTitle = request.projectTitle;
      return prev;
    });
  };

  getRPGraphData(type, reviewVote) {
    var yes = 0, no = 0, empty = 0;
    for (var i = 0; i < reviewVote.length; i++) {
      switch (reviewVote[i].vote.vote) {
        case true:
          yes++;
          break;
        case false:
          no++;
          break;
        default:
          empty++;
          break;
      }
    }
    if (type === 'access') {
      this.setAccessChartData(yes, no, empty, empty === 0 ? false : true);
    } else {
      this.setRPChartData(yes, no, empty, empty === 0 ? false : true);
    }
  }

  setAccessChartData(yes, no, empty, isFormDisabled) {
    this.setState(prev => {
      prev.access.isFormDisabled = isFormDisabled;
      prev.access.chartData = [
        ['Results', 'Votes'],
        ['Yes', yes],
        ['No', no],
        ['Pending', empty]
      ];
      return prev;
    })
  };
  setRPChartData(yes, no, empty, isFormDisabled) {
    this.setState(prev => {
      prev.isFormDisabled = isFormDisabled;
      prev.rp.isFormDisabled = isFormDisabled;
      prev.rp.chartData = [
        ['Results', 'Votes'],
        ['Yes', yes],
        ['No', no],
        ['Pending', empty]
      ];
      return prev;
    })
  }

  render() {

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.projectTitle]),
      this.state.consentName
    ]);

    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "collectAccess", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Collect votes for Data Access Congruence Review", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", onClick: this.back, className: "btn-primary btn-back" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            id: "accessCollectVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.showRPaccordion ? "Q1. Should data access be granted to this applicant?"
              : "Should data access be granted to this applicant?",
            expanded: this.state.isQ1Expanded
          }, [

              hr({ className: "section-separator", style: { 'marginTop': '0' } }),
              h4({ className: "hint" }, ["Please review the Application Summary, Data Use Limitations, and DAC Votes to determine if the researcher should be granted access to the data"]),

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
                      button({ id: "btn_downloadFullApplication", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: () => this.downloadDAR() }, ["Download Full Application"]),
                    ]),

                    div({ className: "col-lg-8 col-md-7 col-sm-7 col-xs-12" }, [

                      div({ className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Research Purpose"]),
                        div({ id: "lbl_rus", className: "response-label" }, [this.state.rus]),
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
                    div({ className: "row no-margin" }, [
                      button({ id: "btn_downloadDataUseLetter", className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: () => this.downloadDUL() }, ["Download Data Use Letter"]),
                    ]),
                  ]),
                ]),
              ]),

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                CollectResultBox({
                  id: "accessCollectResult",
                  title: "Vote Results",
                  color: "access",
                  type: "stats",
                  class: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                  chartData: this.state.access.chartData
                }),

                div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 jumbotron box-vote-results access-background-lighter" }, [
                  SubmitVoteBox({
                    id: "accessCollect",
                    color: "access",
                    title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
                      : "Should data access be granted to this applicant?",
                    isDisabled: this.state.access.isFormDisabled || !Storage.getCurrentUser().isChairPerson,
                    voteStatus: this.state.darOriginalFinalVote,
                    action: { label: "Vote", handler: this.accessCollectVote },
                    rationale: this.state.darOriginalFinalRationale,
                    alertMessage: this.state.alertAccessMessage,
                    showAlert: this.state.showAlertAccess,
                    key: this.state.darOriginalFinalVoteId
                  }),
                  ConfirmationDialog({
                    title: "Post Final Vote?", color: 'access', showModal: this.state.showConfirmationDialogOK,
                    action: { label: "Yes", handler: this.confirmationHandlerOK }
                  }, [
                      div({ className: "dialog-description" }, [
                        span({}, ["If you post this vote the Election will be closed with current results."]),
                      ]),
                    ]),
                  ConfirmationDialog({
                    title: "Post Final Vote?", color: 'access', showModal: this.state.showConfirmationRPDialogOK,
                    action: { label: "Yes", handler: this.confirmationRPHandlerOK }
                  }, [
                      div({ className: "dialog-description" }, [
                        span({}, ["If you post this vote the Election will be closed with current results."]),
                      ]),
                    ])
                ]),
              ]),

              h3({ className: "cm-subtitle" }, ["Data Access Committee Votes"]),

              this.state.voteAccessList.map((row, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, { key: vIndex }, [
                        SingleResultBox({
                          id: "accessSingleResult_" + vIndex,
                          color: "access",
                          data: vm,
                          buttonDisabled: this.state.buttonDisabled,
                          handler: this.handlerReminder
                        })
                      ]);
                    })
                  ]),
                ]);
              }),
              ConfirmationDialog({
                title: this.state.dialogTitle, color: 'access', showModal: this.state.showDialogReminder, type: "informative", action: { label: "Ok", handler: this.dialogHandlerReminder }
              }, [
                  div({ className: "dialog-description" }, [
                    span({ isRendered: this.state.isReminderSent === true }, ["The reminder was successfully sent."]),
                    span({ isRendered: this.state.isReminderSent === false }, ["The reminder couldn't be sent. Please contact Support."]),
                  ]),
                ]),

            ])
        ]),

        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            isRendered: this.state.hasUseRestriction,
            id: "rpCollectVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: "Q2. Was the research purpose accurately converted to a structured format?",
            expanded: this.state.isQ2Expanded
          }, [

              hr({ className: "section-separator", style: { 'marginTop': '0' } }),
              h4({ className: "hint" }, ["Please review the Research Purpose, Structured Research Purpose, and DAC votes to determine if the Research Purpose was appropriately converted to a Structured Research Purpose"]),

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Research Purpose"]),
                  ]),
                  div({ id: "panel_researchPurpose", className: "panel-body cm-boxbody" }, [
                    div({ style: { 'marginBottom': '10px' } }, [this.state.rus]),
                    button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: () => this.downloadDAR() }, ["Download Full Application"]),
                  ])
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Structured Research Purpose"]),
                  ]),
                  div({ id: "panel_structuredPurpose", className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML: { __html: this.state.userestriction } }, [])
                ]),
              ]),

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                CollectResultBox({
                  id: "rpCollectResult",
                  title: "Vote Results",
                  color: "access",
                  type: "stats",
                  class: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                  chartData: this.state.rp.chartData
                }),

                div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 jumbotron box-vote-results access-background-lighter" }, [
                  SubmitVoteBox({
                    id: "rpCollect",
                    color: "access",
                    title: "Q2. Was the research purpose accurately converted to a structured format?",
                    isDisabled: this.state.rp.isFormDisabled || !Storage.getCurrentUser().isChairPerson,
                    voteStatus: this.state.rpOriginalFinalVote,
                    action: { label: "Vote", handler: this.rpCollectVote },
                    rationale: this.state.rpOriginalFinalRationale,
                    alertMessage: this.state.alertRPMessage,
                    showAlert: this.state.showAlertRP,
                    key: this.state.rpOriginalFinalVoteId
                  }),
                ]),
              ]),

              h3({ className: "cm-subtitle" }, ["Data Access Committee Votes"]),

              this.state.rpVoteAccessList.map((row, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, { key: vIndex }, [
                        SingleResultBox({
                          id: "rpSingleResult_" + vIndex,
                          color: "access",
                          data: vm,
                          buttonDisabled: this.state.buttonDisabled,
                          handler: this.handlerReminder
                        })
                      ]);
                    })
                  ])
                ]);
              })
            ])
        ])
      ])
    );
  }
}

export default AccessCollect;
