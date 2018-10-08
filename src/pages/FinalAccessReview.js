import { Component, Fragment } from 'react';
import { div, button, span, b, a, i, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Alert } from '../components/Alert';
import { Storage } from '../libs/storage';
import { DAR, Election, Votes, Match, Files } from '../libs/ajax';
import { Config } from '../libs/config';
import * as Utils from '../libs/utils';

class FinalAccessReview extends Component {

  constructor(props) {
    super(props);
    console.log('PROPS 1: ', this.props);
    this.state = this.initialState();
  }

  componentDidMount() {
    console.log('PROPS 2: ', this.props);
    const currentUser = Storage.getCurrentUser();
    this.setState({
      loading: true,
      currentUser: currentUser,
      referenceId: this.props.match.params.referenceId,
      electionId: this.props.match.params.electionId,
    }, () => {
      this.loadData();
    });
  }

  async loadData() {
    console.log('STATE: ', this.state);
    const hasUseRestrictionResp = await DAR.hasUseRestriction(this.state.referenceId);
    let darInfo = await DAR.describeDar(this.state.referenceId);
    if (!darInfo.hasPurposeStatements) darInfo.purposeStatements = [];

    this.setState({
      path: 'final-access-review',
      hasUseRestrictionResp: hasUseRestrictionResp,
      vote: {},
      voteAgreement: {},
      electionType: null,
      alertOn: null,
      alertsDAR: [],
      alertsAgree: [],
      darInfo: darInfo
    }, () => {
      this.init();
    });



    // reminderDARAlert = function (index) {
    //       $scope.alertsDAR.splice(index, 1);
    //       $scope.alertsDAR.push({
    //           title: 'Please log a vote on Decision Agreement.'
    //       });
    //   };

    // reminderAgreeAlert = function (index) {
    //       $scope.alertOn = true;
    //       $scope.alertsAgree.splice(index, 1);
    //       $scope.alertsAgree.push({
    //           title: 'Please log a vote on Final Access Decision'
    //       });
    //   };

    // closeAlert = function (index) {
    //       $scope.alerts.splice(index, 1);
    //   };

    // downloadDAR = function() {
    //       cmFilesService.getDARFile(referenceId);
    //   };



  }

  initialState() {
    return {
      loading: true,
      // voteStatus: '1',
      // createDate: '2018-08-30',
      // enableFinalButton: false,
      // enableAgreementButton: false,
      // hasUseRestriction: true,
      // projectTitle: 'My Project 01',
      // consentName: 'ORSP-124',
      // isQ1Expanded: false,
      // isQ2Expanded: false,
      // isDulExpanded: false,
      // match: true,
      // election: {
      //   finalVote: '0',
      //   finalRationale: '',
      //   finalVoteDate: '2018-08-30'
      // },
      // electionAccess: {
      //   finalVote: '0',
      //   finalRationale: 'lalala',
      //   finalVoteDate: '2018-08-31'
      // },
      // electionRP: {
      //   finalVote: '0',
      //   finalRationale: '',
      //   finalVoteDate: '2018-08-30'
      // },
      // voteAgreement: {
      //   vote: '0',
      //   rationale: '',
      // },
      // voteList: [],
      // voteAccessList: [
      // ],
      // rpVoteAccessList: [
      // ],

      // darInfo: {
      //   havePI: true,
      //   pi: 'PI name goes here....',
      //   profileName: 'My Profile name',
      //   status: 'OK',
      //   hasAdminComment: true,
      //   adminComment: 'This is an admin comment',
      //   institution: 'Institution',
      //   department: 'Department',
      //   city: 'City',
      //   country: 'Country',
      //   purposeManualReview: true,
      //   researchTypeManualReview: true,
      //   hasDiseases: true,
      //   purposeStatements: [
      //   ],
      //   researchType: [
      //   ],
      //   diseases: [
      //   ]
      // }
    };
  }

  download = (e) => {
    // const filename = e.target.getAttribute('filename');
    // const value = e.target.getAttribute('value');
  }

  downloadDAR = (e) => {
  }

  downloadDUL = (e) => {
  }

  positiveVote = (e) => {
  }

  setEnableFinalButton = (e) => {
  }

  logVote = (e) => {
  }

  toggleQ1 = (e) => {
    this.setState(prev => {
      prev.isQ1Expanded = !prev.isQ1Expanded;
      return prev;
    });
  }

  toggleQ2 = (e) => {
    this.setState(prev => {
      prev.isQ2Expanded = !prev.isQ2Expanded;
      return prev;
    });
  }

  toggleDulExpanded = (e) => {
    this.setState(prev => {
      prev.isDulExpanded = !prev.isDulExpanded;
      return prev;
    });
  }

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    let finalVote = null;
    if (this.state.electionAccess.finalVote === '1' || this.state.electionAccess.finalVote === true || this.state.electionAccess.finalVote === 'true') finalVote = true;
    if (this.state.electionAccess.finalVote === '0' || this.state.electionAccess.finalVote === false || this.state.electionAccess.finalVote === 'false') finalVote = false;

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.projectTitle]),
      this.state.consentName
    ]);

    const agreementData = div({ className: "agreement-data" }, [
      label({}, ["DAC Decision: "]),
      span({ className: "access-color", isRendered: finalVote === true, style: { 'marginLeft': '5px' } }, [b({}, ["YES"])]),
      span({ className: "access-color", isRendered: finalVote === false, style: { 'marginLeft': '5px' } }, [b({}, ["NO"])]),
      span({ className: "access-color", isRendered: finalVote === null, style: { 'marginLeft': '5px' } }, [b({}, ["---"])]),
      label({}, ["DUOS Matching Algorithm Decision: "]),
      span({ className: "access-color", isRendered: this.state.match === '1', style: { 'marginLeft': '5px' } }, [b({}, ["YES"])]),
      span({ className: "access-color", isRendered: this.state.match === '0', style: { 'marginLeft': '5px' } }, [b({}, ["NO"])]),
      span({ className: "access-color", isRendered: this.state.match === null, style: { 'marginLeft': '5px' } }, [b({}, ["---"])]),
      span({ className: "cancel-color", isRendered: this.state.match === '-1', style: { 'marginLeft': '5px' } }, [
        "Automated Vote System Failure. Please report this issue via the \"Request Help\" link"]),
    ]);

    console.log('render ....', this.state);
    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "finalAccess", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Final voting for Data Access Review", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", href: "/chair_console", className: "btn-primary btn-back" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "accordion-title access-color" }, [
          "Does the DAC grant this researcher permission to access the data?"
        ]),
        hr({ className: "section-separator" }),

        h4({ className: "hint", isRendered: this.state.hasUseRestriction === true }, ["Please review the Application Summary and Data Use Limitations to answer the two questions below. br(), You may review other DAC votes related to this data access request below the questions on this page."]),
        h4({ className: "hint", isRendered: !this.state.hasUseRestriction === true }, ["Please review the Application Summary and Data Use Limitations to answer the question below. br(), You may review other DAC votes related to this data access request below the question on this page."]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead access-color" }, [
              h4({}, ["Application Summary"]),
            ]),
            div({ id: "rp", className: "panel-body" }, [
              div({ className: "row dar-summary" }, [
                div({ className: "control-label access-color" }, ["Research Purpose"]),
                div({ className: "response-label" }, [this.state.dar.rus]),
              ]),

              div({ className: "row dar-summary" }, [
                div({ className: "control-label access-color" }, ["Structured Research Purpose"]),
                div({ className: "response-label", dangerouslySetInnerHTML: { __html: this.state.darInfo.sDar } }, []),
                a({
                  isRendered: this.state.hasUseRestriction, onClick: this.download,
                  filename: 'machine-readable-DAR.json',
                  value: "mrDAR", className: "italic hover-color"
                }, ["Download DAR machine-readable format"]),
              ]),

              div({ isRendered: this.state.darInfo.hasPurposeStatements === true, className: "row dar-summary" }, [
                div({ className: "control-label access-color" }, ["Purpose Statement"]),
                div({ className: "response-label" }, [
                  ul({}, [
                    this.state.darInfo.purposeStatements.map((purpose, rIndex) => {
                      return h(Fragment, {}, [
                        li({ className: purpose.manualReview ? 'cancel-color' : '' }, [
                          b({}, [purpose.title]), purpose.description
                        ])
                      ]);
                    })
                  ]),
                  div({ isRendered: this.state.darInfo.purposeManualReview && !this.state.darInfo.researchTypeManualReview, className: "summary-alert" }, [
                    Alert({ id: "purposeStatementManualReview", type: "danger", title: "This research involves studying a sensitive population and requires manual review." })
                  ])
                ]),

                div({ className: "row dar-summary" }, [
                  div({ className: "control-label access-color" }, ["Type of Research"]),
                  div({ className: "response-label" }, [
                    ul({}, [
                      this.state.darInfo.researchType.map((type, rIndex) => {
                        return h(Fragment, {}, [
                          li({ className: type.manualReview ? 'cancel-color' : '' }, [
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

                div({ isRendered: this.state.darInfo.hasDiseases === true, className: "row dar-summary" }, [
                  div({ className: "control-label access-color" }, ["Disease area(s)"]),
                  div({ className: "response-label" }, [
                    ul({}, [
                      this.state.darInfo.diseases.map((disease, rIndex) => {
                        return h(Fragment, {}, [
                          li({}, [
                            disease
                          ]),
                        ]);
                      })
                    ]),
                  ]),
                ]),
                div({ isRendered: this.state.darInfo.havePI === true, className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Principal Investigator: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.pi]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Researcher: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.profileName]),
                  div({ className: "row no-margin" }, [
                    label({ className: "control-label no-padding" }, ["Status: "]),
                    span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.status]),
                    span({ isRendered: this.state.darInfo.hasAdminComment === true }, [
                      label({ className: "control-label no-padding" }, [" - Comment: "]),
                      span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.adminComment]),
                    ]),
                  ]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Institution: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.institution]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Department: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.department]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["City: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.city]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Country: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.country]),
                ]),
                button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
              ]),
            ]),
          ]),

          //---------------------------------

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [

            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Data Use Limitations"]),
            ]),
            div({ id: "dul", className: "panel-body cm-boxbody" }, [
              div({ className: "row no-margin" }, [
                button({
                  id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color",
                  onClick: this.downloadDUL
                }, ["Download Data Use Letter"]),
              ]),
              div({ className: "row dar-summary" }, [
                div({ className: "control-label dul-color" }, ["Structured Limitations"]),
                div({ className: "response-label", dangerouslySetInnerHTML: { __html: this.state.darInfo.sDul } }, []),
                a({ id: "btn_downloadSDul", onClick: this.download, filename: 'machine-readable-DUL.json', value: "mrDUL", className: "italic hover-color" }, ["Download DUL machine-readable format"]),
              ]),
            ]),
          ]),

        ]),

        hr({ className: "section-separator" }),

        //-------------------------------


        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [

          div({
            className: "jumbotron box-vote-results access-background-lighter " + (this.state.hasUseRestriction ? 'col-lg-6 col-md-6 col-sm-12 col-xs-12'
              : 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12 center-margin')
          }, [

              SubmitVoteBox({
                id: "finalAccess",
                color: "access",
                title: this.state.hasUseRestriction === true ? "Q1. Does the DAC grant this researcher permission to access the data?"
                  : "Does the DAC grant this researcher permission to access the data?",
                isDisabled: this.state.isFormDisabled,
                voteStatus: this.state.voteStatus,
                action: { label: "Vote", handler: this.submit }
              }),
            ]),


          div({
            isRendered: this.state.hasUseRestriction === true, className: "jumbotron box-vote-results access-background-lighter col-lg-6 col-md-6 col-sm-12 col-xs-12"
          }, [

              SubmitVoteBox({
                id: "agreement",
                color: "access",
                title: "Q2. Is the DAC decision consistent with the DUOS Matching Algorithm decision?",
                isDisabled: this.state.isFormDisabled,
                agreementData: agreementData,
                voteStatus: this.state.voteStatus,
                action: { label: "Vote", handler: this.submit }
              }),
            ]),

        ]),

        //---------------------------------------------------------/

        h3({ className: "cm-subtitle" }, ["Data Access Committee Voting Results"]),

        div({ className: "row no-margin" }, [

          CollapsiblePanel({
            id: "accessCollectVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
              : "Should data access be granted to this applicant?",
            expanded: this.state.isQ1Expanded
          }, [

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [

                CollectResultBox({
                  id: "accessCollectResult",
                  title: "DAC Decision",
                  color: "access",
                  class: "col-lg-7 col-md-7 col-sm-12 col-xs-12",
                  vote: this.state.electionAccess.finalVote,
                  voteDate: this.state.electionAccess.finalVoteDate,
                  rationale: this.state.electionAccess.finalRationale,
                  chartData: this.state.chartDataAccess.Total
                }),

                div({
                  isRendered: this.state.hasUseRestriction,
                  className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 jumbotron box-vote-results no-padding"
                }, [
                    h4({ className: "box-vote-title access-color" }, ["DUOS Matching Algorithm Decision"]),
                    hr({ className: "box-separator" }),
                    div({ className: "results-box" }, [
                      div({ className: "row" }, [
                        label({ className: "col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color" }, ["Vote: "]),
                        div({ id: "lbl_resultMatch", className: "col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label bold" }, [
                          span({ isRendered: this.state.match === '1' }, ["YES"]),
                          span({ isRendered: this.state.match === '0' }, ["NO"]),
                          span({ isRendered: this.state.match === null }, []),
                          span({ className: "cancel-color", isRendered: this.state.match === '-1' }, [
                            "Automated Vote System Failure. Please report this issue via the \"Request Help\" link"
                          ]),
                        ]),
                      ]),
                      div({ className: "row" }, [
                        label({ className: "col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color" }, ["Date: "]),
                        div({ id: "lbl_dateMatch", className: "col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label" }, [this.state.createDate /* | date:dateFormat */]),
                      ]),
                    ]),
                  ]),
              ]),

              this.state.voteAccessList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
                        SingleResultBox({
                          id: "accessSingleResult_" + vIndex,
                          color: "access",
                          data: vm
                        })
                      ]);
                    })
                  ]),
                ]);
              })
            ]),


          //---------------------------------------------------------/

          CollapsiblePanel({
            isRendered: this.state.showRPaccordion,
            id: "rpCollectVotes",
            onClick: this.toggleQ2,
            color: 'access',
            title: "Q2. Was the research purpose accurately converted to a structured format?",
            expanded: this.state.isQ2Expanded
          }, [

              div({ className: "row no-margin" }, [
                CollectResultBox({
                  id: "rpCollectResult",
                  title: "DAC Decision",
                  color: "access",
                  class: "col-lg-8 col-md-8 col-sm-12 col-xs-12",
                  vote: this.state.electionRP.finalVote,
                  voteDate: this.state.electionRP.finalVoteDate,
                  rationale: this.state.electionRP.finalRationale,
                  chartData: this.state.chartRP.Total
                })
              ]),

              this.state.rpVoteAccessList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
                        SingleResultBox({
                          id: "rpSingleResult_" + vIndex,
                          color: "access",
                          data: vm
                        })
                      ]);
                    })
                  ]),
                ]);
              })
            ]),

          //---------------------------------------------------------/

          CollapsiblePanel({
            id: "dulCollectVotes",
            onClick: this.toggleDulExpanded,
            color: 'dul',
            title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
            expanded: this.state.isDULExpanded
          }, [

              div({ className: "row no-margin" }, [
                CollectResultBox({
                  id: "dulCollectResult",
                  title: "DAC Decision",
                  color: "dul",
                  class: "col-lg-8 col-md-8 col-sm-12 col-xs-12",
                  vote: this.state.election.finalVote,
                  voteDate: this.state.election.finalVoteDate,
                  rationale: this.state.election.finalRationale,
                  chartData: this.state.chartDataDUL.Total
                })
              ]),


              this.state.voteList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
                        SingleResultBox({
                          id: "dulSingleResult_" + vIndex,
                          color: "dul",
                          data: vm
                        })
                      ]);
                    })
                  ]),
                ]);
              })
            ]),
        ])
      ])
    );
  }



  init = async () => {

    const vote = await Votes.getDarFinalAccessVote(this.state.electionId);
    if (vote.vote !== null) {
      this.setState({
        alreadyVote: true,
        originalVote: vote.vote,
        originalRationale: vote.rationale
      });
    }

    const data1 = await Election.findDataAccessElectionReview(this.state.electionId, false);
    await this.showAccessData(data1);
    const data2 = await Election.findRPElectionReview(this.state.electionId, false);

    if (data2.election !== undefined) {
      console.log("electionRP ---> ", data2);
      this.setState({
        electionRP: data2.election
      });

      if (data2.election.finalRationale === null) {
        this.setState(prev => {
          prev.electionRP.finalRationale = '';
          return prev;
        })
      }

      this.setState({
        statusRP: data2.election.status,
        rpVoteAccessList: this.chunk(data2.reviewVote, 2),
        chartRP: this.getGraphData(data2.reviewVote),
        showRPaccordion: true
      });
    } else {
      this.setState({
        electionRP: {},
        rpVoteAccessList: [],
        chartRP: { 'Total': [] },
        showRPaccordion: false
      })
    }


    this.setState({
      consentName: data1.associatedConsent.name
    });

    const data3 = await Election.findElectionReviewById(data1.associatedConsent.electionId, data1.associatedConsent.consentId);
    this.setState({
      electionReview: data3
    });

    await this.showDULData(data3);
    await this.vaultVote(data3.consent.consentId);

    this.setState({
      loading: false
    });
  }

  showAccessData = async (electionReview) => {
    if (Boolean(electionReview.voteAgreement)) {
      this.setState({
        originalAgreementVote: electionReview.voteAgreement.vote,
        originalAgreementRationale: electionReview.voteAgreement.rationale
      });
    }

    const dar = await DAR.getDarFields(electionReview.election.referenceId, "rus");
    this.setState({
      dar: dar
    });

    const ptitle = await DAR.getDarFields(electionReview.election.referenceId, "projectTitle");
    this.setState({
      projectTitle: ptitle.projectTitle
    });

    this.setState({
      electionAccess: electionReview.election
    });

    if (electionReview.election.finalRationale === null) {
      this.setState(prev => {
        prev.electionAccess.finalRationale = '';
        return prev;
      });
    }

    this.setState({
      sDar: electionReview.election.translatedUseRestriction,
      mrDAR: JSON.stringify(electionReview.election.useRestriction, null, 2),
      status: electionReview.election.status,
      voteAccessList: this.chunk(electionReview.reviewVote, 2),
      chartDataAccess: this.getGraphData(electionReview.reviewVote),
      voteAgreement: electionReview.voteAgreement
    });

    if (Boolean(electionReview.voteAgreement) && electionReview.voteAgreement.vote !== null) {
      this.setState({
        agreementAlreadyVote: true
      });
    }
  }

  showDULData = async (electionReview) => {
    this.setState({
      election: electionReview.election
    });

    if (electionReview.election.finalRationale === null) {
      this.setState(prev => {
        prev.election.finalRationale = '';
        return prev;
      });
    }

    this.setState({
      sDul: electionReview.election.translatedUseRestriction,
      mrDUL: JSON.stringify(electionReview.election.useRestriction, null, 2),
      downloadUrl: await Config.getApiUrl() + 'consent/' + electionReview.consent.consentId + '/dul',
      dulName: electionReview.election.dulName,
      status: electionReview.election.status,
      voteList: this.chunk(electionReview.reviewVote, 2),
      chartDataDUL: this.getGraphData(electionReview.reviewVote),
    });

  }

  vaultVote = async (consentId) => {
    console.log('Match: ', consentId, this.state.referenceId); //this.state.electionAccess.referenceId);
    const data = await Match.findMatch(consentId, this.state.referenceId);
    console.log("after match call ...............................................", data);
    if (data.failed !== null && data.failed !== undefined && data.failed) {
      this.setState({
        hideMatch: false,
        match: "-1",
        createDate: data.createDate
      });
    } else if (data.match !== null && data.match !== undefined) {
      this.setState({
        hideMatch: false,
        match: data.match,
        createDate: data.createDate
      });
    } else {
      this.setState({
        hideMatch: true
      });
    }
  }

  chunk = (arr, size) => {
    var newArr = [];
    for (var i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }


  getGraphData = (reviewVote) => {
    var yes = 0, no = 0, empty = 0;
    for (var i = 0; i < reviewVote.length; i++) {
      if (reviewVote[i].vote.type === 'DAC') {
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
    }
    var chartData = {
      'Total': [
        ['Results', 'Votes'],
        ['YES', yes],
        ['NO', no],
        ['Pending', empty]
      ]
    };
    return chartData;
  }

  // $scope.positiveVote = function () {
  //   $scope.vote.rationale = null;
  //   $scope.setEnableFinalButton();
  // };

  // $scope.positiveAgreementVote = function () {
  //   $scope.voteAgreement.rationale = null;
  //   $scope.enableAgreementButton();
  // };


  // $scope.setEnableAgreementButton = function () {
  //   if (Boolean($scope.voteAgreement) && $scope.voteAgreement.vote === $scope.originalAgreementVote && $scope.voteAgreement.rationale === $scope.originalAgreementRationale) {
  //     $scope.enableAgreementButton = false;
  //   } else {
  //     $scope.enableAgreementButton = true;
  //   }
  // };

  // $scope.setEnableFinalButton = function () {
  //   if ($scope.vote.vote === $scope.originalVote && $scope.vote.rationale === $scope.originalRationale) {
  //     $scope.enableFinalButton = false;
  //   } else {
  //     $scope.enableFinalButton = true;
  //   }
  // };

}

export default FinalAccessReview;
